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

  public getModelUri(monaco: Monaco, projectId: string, filePath: string): any {
    const normPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    return monaco.Uri.parse(`sprintforge://${projectId}/${normPath}`);
  }

  public getModel(projectId: string, filePath: string): any | null {
    const normPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const uriKey = `sprintforge://${projectId}/${normPath}`;
    const model = this.models.get(uriKey);
    if (model && !model.isDisposed()) {
      return model;
    }
    return null;
  }

  /**
   * Retrieves an existing ITextModel or creates a new canonical model for the file URI.
   */
  public getOrCreateModel(
    monaco: Monaco,
    projectId: string,
    filePath: string,
    initialContent: string = ""
  ): any {
    const uri = this.getModelUri(monaco, projectId, filePath);
    const uriKey = uri.toString();

    let model = monaco.editor.getModel(uri);
    if (model && !model.isDisposed()) {
      this.models.set(uriKey, model);
      return model;
    }

    const language = getLanguageFromPath(filePath);
    model = monaco.editor.createModel(initialContent, language, uri);
    this.models.set(uriKey, model);
    return model;
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
    const normPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const model = this.getOrCreateModel(monaco, projectId, normPath, initialContent || "");
    const uriKey = model.uri.toString();

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
   * Disposes the collaboration session and Monaco model when a tab is closed.
   */
  public disposeFile(monaco: Monaco | null, projectId: string, filePath: string): void {
    const normPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    const uriKey = `sprintforge://${projectId}/${normPath}`;

    const collab = this.collaborations.get(uriKey);
    if (collab) {
      collab.destroy();
      this.collaborations.delete(uriKey);
    }

    if (monaco) {
      const uri = monaco.Uri.parse(uriKey);
      const model = monaco.editor.getModel(uri);
      if (model && !model.isDisposed()) {
        model.dispose();
      }
    }
    this.models.delete(uriKey);
  }

  /**
   * Disposes all project models and collaborations when switching workspaces.
   */
  public disposeProject(monaco: Monaco | null, projectId: string): void {
    const prefix = `sprintforge://${projectId}/`;
    for (const [key, collab] of this.collaborations.entries()) {
      if (key.startsWith(prefix)) {
        collab.destroy();
        this.collaborations.delete(key);
      }
    }
    for (const [key, model] of this.models.entries()) {
      if (key.startsWith(prefix)) {
        if (model && !model.isDisposed()) {
          model.dispose();
        }
        this.models.delete(key);
      }
    }
  }
}

export const monacoModelManager = MonacoModelManager.getInstance();
