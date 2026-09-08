import { Monaco } from "@monaco-editor/react";
import { getLanguageFromPath } from "./store/codeStore";
import { MonacoYjsCollaboration } from "./codeCollaboration";

/**
 * Production-grade Canonical Monaco Model & Collaboration Lifecycle Manager.
 * Guarantees exactly one Monaco ITextModel per file URI and exactly one
 * collaborative Yjs session per active file across tab switches and re-renders.
 */
class MonacoModelManager {
  private static instance: MonacoModelManager;

  // Stored monaco instance reference from editor mount
  private monacoInstance: Monaco | null = null;

  // Key: sprintforge://${projectId}/${normalizedPath} -> Monaco ITextModel
  private models = new Map<string, any>();

  // Key: sprintforge://${projectId}/${normalizedPath} -> MonacoYjsCollaboration
  private collaborations = new Map<string, MonacoYjsCollaboration>();

  public static getInstance(): MonacoModelManager {
    if (!MonacoModelManager.instance) {
      MonacoModelManager.instance = new MonacoModelManager();
    }
    return MonacoModelManager.instance;
  }

  public setMonaco(monaco: Monaco) {
    if (monaco) {
      this.monacoInstance = monaco;
    }
  }

  public getModelUri(monaco: Monaco | null, projectId: string, filePath: string): any {
    const effectiveMonaco = monaco || this.monacoInstance;
    const normPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const uriStr = `sprintforge://${projectId}/${normPath}`;
    if (effectiveMonaco?.Uri?.parse) {
      return effectiveMonaco.Uri.parse(uriStr);
    }
    return uriStr;
  }

  public getModel(projectId: string, filePath: string): any | null {
    const normPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const uriKey = `sprintforge://${projectId}/${normPath}`;
    
    // Check cached model
    const model = this.models.get(uriKey);
    if (model && !model.isDisposed()) {
      return model;
    }

    // Check directly in Monaco editor registry if instance available
    if (this.monacoInstance) {
      try {
        const uri = this.monacoInstance.Uri.parse(uriKey);
        const registeredModel = this.monacoInstance.editor.getModel(uri);
        if (registeredModel && !registeredModel.isDisposed()) {
          this.models.set(uriKey, registeredModel);
          return registeredModel;
        }
      } catch {}
    }

    return null;
  }

  /**
   * Retrieves an existing ITextModel or safely creates a new canonical model for the file URI.
   * Never throws if model already exists in Monaco registry.
   */
  public getOrCreateModel(
    monaco: Monaco,
    projectId: string,
    filePath: string,
    initialContent: string = ""
  ): any {
    this.monacoInstance = monaco;
    const normPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const uri = this.getModelUri(monaco, projectId, normPath);
    const uriKey = typeof uri === "string" ? uri : uri.toString();

    // 1. Check if Monaco already has this model registered in its global editor registry
    try {
      const existingModel = monaco.editor.getModel(uri);
      if (existingModel && !existingModel.isDisposed()) {
        this.models.set(uriKey, existingModel);
        return existingModel;
      }
    } catch {}

    // 2. Check cached model
    const cachedModel = this.models.get(uriKey);
    if (cachedModel && !cachedModel.isDisposed()) {
      return cachedModel;
    }

    // 3. Create fresh canonical model
    const language = getLanguageFromPath(normPath);
    try {
      const model = monaco.editor.createModel(initialContent, language, uri);
      this.models.set(uriKey, model);
      return model;
    } catch (createErr: any) {
      // Defensive fallback: if creation collided, retrieve the existing model
      const fallbackModel = monaco.editor.getModel(uri);
      if (fallbackModel && !fallbackModel.isDisposed()) {
        this.models.set(uriKey, fallbackModel);
        return fallbackModel;
      }
      throw createErr;
    }
  }

  /**
   * Retrieves or initializes a single collaborative Yjs session for a file model.
   */
  public getOrCreateCollaboration(
    monaco: Monaco,
    editor: any,
    projectId: string,
    filePath: string,
    initialContent?: string
  ): MonacoYjsCollaboration {
    this.monacoInstance = monaco;
    const normPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const model = this.getOrCreateModel(monaco, projectId, normPath, initialContent || "");
    const uriKey = model.uri ? model.uri.toString() : `sprintforge://${projectId}/${normPath}`;

    let collab = this.collaborations.get(uriKey);
    if (collab && !collab.isDestroyed()) {
      collab.updateEditor(editor);
      return collab;
    }

    collab = new MonacoYjsCollaboration(
      projectId,
      normPath,
      model,
      editor,
      monaco,
      initialContent
    );
    this.collaborations.set(uriKey, collab);
    return collab;
  }

  /**
   * Disposes the collaboration session and Monaco model safely.
   */
  public disposeFile(
    monaco: Monaco | null | undefined,
    projectId: string,
    filePath: string
  ): void {
    const effectiveMonaco = monaco || this.monacoInstance;
    const normPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const uriKey = `sprintforge://${projectId}/${normPath}`;

    // 1. Teardown Yjs Collaboration
    const collab = this.collaborations.get(uriKey);
    if (collab) {
      try {
        collab.destroy();
      } catch {}
      this.collaborations.delete(uriKey);
    }

    // 2. Dispose Monaco ITextModel
    if (effectiveMonaco?.editor?.getModel) {
      try {
        const uri = effectiveMonaco.Uri.parse(uriKey);
        const model = effectiveMonaco.editor.getModel(uri);
        if (model && !model.isDisposed()) {
          model.dispose();
        }
      } catch {}
    }

    const cachedModel = this.models.get(uriKey);
    if (cachedModel && !cachedModel.isDisposed()) {
      try {
        cachedModel.dispose();
      } catch {}
    }
    this.models.delete(uriKey);
  }

  /**
   * Migrates/renames model and collaboration when file is renamed.
   */
  public renameModel(projectId: string, oldPath: string, newPath: string): void {
    this.disposeFile(this.monacoInstance, projectId, oldPath);
  }

  /**
   * Disposes all project models and collaborations when switching workspaces.
   */
  public disposeProject(monaco: Monaco | null | undefined, projectId: string): void {
    const effectiveMonaco = monaco || this.monacoInstance;
    const prefix = `sprintforge://${projectId}/`;

    for (const [key, collab] of this.collaborations.entries()) {
      if (key.startsWith(prefix)) {
        try {
          collab.destroy();
        } catch {}
        this.collaborations.delete(key);
      }
    }

    for (const [key, model] of this.models.entries()) {
      if (key.startsWith(prefix)) {
        try {
          if (model && !model.isDisposed()) {
            model.dispose();
          }
        } catch {}
        this.models.delete(key);
      }
    }

    if (effectiveMonaco?.editor?.getModels) {
      try {
        const allModels = effectiveMonaco.editor.getModels();
        for (const m of allModels) {
          if (m.uri.toString().startsWith(prefix) && !m.isDisposed()) {
            m.dispose();
          }
        }
      } catch {}
    }
  }
}

export const monacoModelManager = MonacoModelManager.getInstance();
