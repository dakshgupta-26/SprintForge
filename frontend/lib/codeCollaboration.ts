import * as Y from "yjs";
import { getSocket } from "./socket";
import { useCodeStore } from "./store/codeStore";

export interface RemoteCursorInfo {
  socketId: string;
  userId: string;
  userName: string;
  avatar?: string;
  color: string;
  cursor?: { line: number; column: number };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  decorationIds?: string[];
}

/**
 * Production-grade Yjs CRDT Monaco Collaboration Session.
 * Manages single-document CRDT state, granular delta synchronization,
 * multi-user cursor awareness, and strict listener lifecycle cleanup.
 */
export class MonacoYjsCollaboration {
  private doc: Y.Doc;
  private yText: Y.Text;
  private monaco: any;
  private model: any;
  private editor: any;
  private projectId: string;
  private filePath: string;
  private isApplyingRemoteUpdate = false;
  private monacoBindingDisposables: any[] = [];
  private remoteCursors = new Map<string, RemoteCursorInfo>();
  private cursorDecorationsCollection: any = null;
  private _isDestroyed = false;

  constructor(
    projectId: string,
    filePath: string,
    model: any,
    editor: any,
    monaco: any,
    initialContent?: string
  ) {
    this.projectId = projectId;
    this.filePath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
    this.model = model;
    this.editor = editor;
    this.monaco = monaco;
    this.doc = new Y.Doc();
    this.yText = this.doc.getText("monaco");

    this.initSocketEvents(initialContent);
    this.bindModelEvents();
    this.bindEditorCursorEvents();
  }

  public isDestroyed(): boolean {
    return this._isDestroyed;
  }

  public updateEditor(newEditor: any) {
    if (this._isDestroyed) return;
    this.editor = newEditor;
    if (this.cursorDecorationsCollection) {
      try {
        this.cursorDecorationsCollection.clear();
      } catch {}
      this.cursorDecorationsCollection = null;
    }
    this.renderRemoteCursors();
  }

  private initSocketEvents(initialContent?: string) {
    const socket = getSocket();
    if (!socket) return;

    // 1. Join file collaboration room with current state vector
    const joinFileRoom = () => {
      if (!socket.connected) return;
      const stateVector = Y.encodeStateVector(this.doc);
      socket.emit("code:join:file", {
        projectId: this.projectId,
        filePath: this.filePath,
        clientStateVector: Array.from(stateVector),
      });
    };

    joinFileRoom();

    // Re-join and re-sync on socket reconnect
    const handleReconnect = () => {
      joinFileRoom();
    };
    socket.on("connect", handleReconnect);

    // 2. Receive Sync Step 2 diff from server (authoritative document state)
    const handleSyncStep2 = (data: {
      projectId: string;
      filePath: string;
      update: number[];
    }) => {
      if (
        data.projectId === this.projectId &&
        data.filePath === this.filePath &&
        !this._isDestroyed
      ) {
        this.isApplyingRemoteUpdate = true;
        try {
          if (data.update && data.update.length > 0) {
            Y.applyUpdate(this.doc, new Uint8Array(data.update), "server-sync");
          }

          // If the server doc was completely empty and client has initial content, populate Yjs doc
          if (
            this.yText.length === 0 &&
            initialContent &&
            initialContent.length > 0
          ) {
            this.doc.transact(() => {
              this.yText.insert(0, initialContent);
            }, "local");
          } else if (this.model && !this.model.isDisposed()) {
            const authoritativeText = this.yText.toString();
            if (this.model.getValue() !== authoritativeText) {
              const fullRange = this.model.getFullModelRange();
              this.model.applyEdits([
                { range: fullRange, text: authoritativeText },
              ]);
            }
          }
        } finally {
          this.isApplyingRemoteUpdate = false;
        }
      }
    };

    // 3. Receive incremental delta updates from collaborators
    const handleDocUpdate = (data: {
      projectId: string;
      filePath: string;
      update: number[];
      senderSocketId?: string;
    }) => {
      if (
        data.projectId === this.projectId &&
        data.filePath === this.filePath &&
        !this._isDestroyed
      ) {
        if (data.senderSocketId === socket.id) return;
        this.isApplyingRemoteUpdate = true;
        try {
          Y.applyUpdate(this.doc, new Uint8Array(data.update), "remote");
        } finally {
          this.isApplyingRemoteUpdate = false;
        }
      }
    };

    // 4. Receive Remote Collaborator Awareness (Cursors & Selections)
    const handleAwarenessUpdate = (
      info: RemoteCursorInfo & { filePath: string }
    ) => {
      if (
        info.filePath === this.filePath &&
        info.socketId !== socket.id &&
        !this._isDestroyed
      ) {
        this.remoteCursors.set(info.socketId, info);
        this.renderRemoteCursors();
      }
    };

    // 5. Remote collaborator left file
    const handleAwarenessLeave = (data: {
      socketId: string;
      filePath: string;
    }) => {
      if (
        data.filePath === this.filePath &&
        this.remoteCursors.has(data.socketId) &&
        !this._isDestroyed
      ) {
        this.remoteCursors.delete(data.socketId);
        this.renderRemoteCursors();
      }
    };

    socket.on("code:sync:step2", handleSyncStep2);
    socket.on("code:doc:update", handleDocUpdate);
    socket.on("code:awareness:update", handleAwarenessUpdate);
    socket.on("code:awareness:leave", handleAwarenessLeave);

    // Track disposables for teardown
    this.monacoBindingDisposables.push({
      dispose: () => {
        socket.off("connect", handleReconnect);
        socket.off("code:sync:step2", handleSyncStep2);
        socket.off("code:doc:update", handleDocUpdate);
        socket.off("code:awareness:update", handleAwarenessUpdate);
        socket.off("code:awareness:leave", handleAwarenessLeave);
        if (socket.connected) {
          socket.emit("code:leave:file", {
            projectId: this.projectId,
            filePath: this.filePath,
          });
        }
      },
    });
  }

  private bindModelEvents() {
    const socket = getSocket();
    if (!this.model || this.model.isDisposed()) return;

    // A. Yjs Text changes -> Apply granular delta edits to Monaco Model buffer
    const handleYTextChange = (event: Y.YTextEvent) => {
      if (this.isApplyingRemoteUpdate && this.model && !this.model.isDisposed()) {
        const edits: any[] = [];
        let index = 0;

        for (const op of event.delta) {
          if (op.retain !== undefined) {
            index += op.retain;
          }
          if (op.delete !== undefined) {
            const startPos = this.model.getPositionAt(index);
            const endPos = this.model.getPositionAt(index + op.delete);
            edits.push({
              range: new this.monaco.Range(
                startPos.lineNumber,
                startPos.column,
                endPos.lineNumber,
                endPos.column
              ),
              text: "",
            });
          }
          if (op.insert !== undefined) {
            const textToInsert =
              typeof op.insert === "string" ? op.insert : "";
            if (textToInsert.length > 0) {
              const pos = this.model.getPositionAt(index);
              edits.push({
                range: new this.monaco.Range(
                  pos.lineNumber,
                  pos.column,
                  pos.lineNumber,
                  pos.column
                ),
                text: textToInsert,
              });
              index += textToInsert.length;
            }
          }
        }

        if (edits.length > 0) {
          this.model.applyEdits(edits);
        } else if (this.model.getValue() !== this.yText.toString()) {
          const fullRange = this.model.getFullModelRange();
          this.model.applyEdits([
            { range: fullRange, text: this.yText.toString() },
          ]);
        }
      }
    };

    this.yText.observe(handleYTextChange);

    // B. Local Monaco Model Edits -> Yjs Document Transaction
    const contentListener = this.model.onDidChangeContent((e: any) => {
      if (this.isApplyingRemoteUpdate || this._isDestroyed) return;

      this.doc.transact(() => {
        for (const change of e.changes) {
          const index = change.rangeOffset;
          const length = change.rangeLength;
          if (length > 0) {
            this.yText.delete(index, length);
          }
          if (change.text.length > 0) {
            this.yText.insert(index, change.text);
          }
        }
      }, "local");

      // Mark active tab dirty in store
      useCodeStore.getState().markTabDirty(this.filePath, true);
    });

    this.monacoBindingDisposables.push(contentListener);

    // C. Yjs Local Updates -> Binary Delta Broadcast over WebSocket
    const docUpdateListener = (update: Uint8Array, origin: any) => {
      if (origin === "local" && socket?.connected && !this._isDestroyed) {
        socket.emit("code:doc:update", {
          projectId: this.projectId,
          filePath: this.filePath,
          update: Array.from(update),
        });
      }
    };

    this.doc.on("update", docUpdateListener);

    this.monacoBindingDisposables.push({
      dispose: () => {
        this.yText.unobserve(handleYTextChange);
        this.doc.off("update", docUpdateListener);
      },
    });
  }

  private bindEditorCursorEvents() {
    const socket = getSocket();
    if (!this.editor) return;

    let cursorDebounce: any = null;
    const cursorListener = this.editor.onDidChangeCursorPosition((e: any) => {
      // Only broadcast if the editor is currently displaying this file's model
      if (this.editor.getModel() !== this.model || this._isDestroyed) return;

      if (cursorDebounce) clearTimeout(cursorDebounce);
      cursorDebounce = setTimeout(() => {
        if (!socket?.connected || this._isDestroyed) return;
        const selection = this.editor.getSelection();
        socket.emit("code:awareness:update", {
          projectId: this.projectId,
          filePath: this.filePath,
          cursor: { line: e.position.lineNumber, column: e.position.column },
          selection: selection
            ? {
                startLineNumber: selection.startLineNumber,
                startColumn: selection.startColumn,
                endLineNumber: selection.endLineNumber,
                endColumn: selection.endColumn,
              }
            : undefined,
        });
      }, 40);
    });

    this.monacoBindingDisposables.push(cursorListener);
  }

  /**
   * Renders live colored cursor decorations and selection highlights for all active peers.
   */
  private renderRemoteCursors() {
    if (!this.editor || !this.monaco || this._isDestroyed) return;
    if (this.editor.getModel() !== this.model) return;

    const decorations: any[] = [];

    this.remoteCursors.forEach((remote) => {
      if (!remote.cursor) return;

      const { line, column } = remote.cursor;
      const color = remote.color || "#a855f7";

      // 1. Cursor line decoration
      decorations.push({
        range: new this.monaco.Range(line, column, line, column),
        options: {
          className: `remote-cursor-${remote.socketId}`,
          beforeContentClassName: `remote-cursor-head-${remote.socketId}`,
          hoverMessage: { value: `**${remote.userName}** (collaborating)` },
          stickiness:
            this.monaco.editor.TrackedRangeStickiness
              .NeverGrowsWhenTypingAtEdges,
        },
      });

      // 2. Selection range decoration (if text selected)
      if (remote.selection) {
        const sel = remote.selection;
        if (
          sel.startLineNumber !== sel.endLineNumber ||
          sel.startColumn !== sel.endColumn
        ) {
          decorations.push({
            range: new this.monaco.Range(
              sel.startLineNumber,
              sel.startColumn,
              sel.endLineNumber,
              sel.endColumn
            ),
            options: {
              className: `remote-selection-${remote.socketId}`,
              stickiness:
                this.monaco.editor.TrackedRangeStickiness
                  .NeverGrowsWhenTypingAtEdges,
            },
          });
        }
      }

      // Inject custom CSS for remote cursor
      this.injectCursorStyles(remote.socketId, color, remote.userName);
    });

    if (!this.cursorDecorationsCollection) {
      this.cursorDecorationsCollection =
        this.editor.createDecorationsCollection(decorations);
    } else {
      this.cursorDecorationsCollection.set(decorations);
    }
  }

  private injectCursorStyles(socketId: string, color: string, name: string) {
    const styleId = `cursor-style-${socketId}`;
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
      .remote-cursor-${socketId} {
        border-left: 2px solid ${color} !important;
        position: relative;
      }
      .remote-cursor-head-${socketId}::after {
        content: "${name}";
        position: absolute;
        top: -18px;
        left: -2px;
        background-color: ${color};
        color: #ffffff;
        font-size: 10px;
        font-weight: 600;
        padding: 1px 4px;
        border-radius: 3px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 100;
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        opacity: 0.95;
        transition: opacity 0.3s ease;
      }
      .remote-selection-${socketId} {
        background-color: ${color}33 !important;
      }
    `;
  }

  public destroy() {
    this._isDestroyed = true;
    this.monacoBindingDisposables.forEach((d) => d.dispose?.());
    this.monacoBindingDisposables = [];
    if (this.cursorDecorationsCollection) {
      try {
        this.cursorDecorationsCollection.clear();
      } catch {}
      this.cursorDecorationsCollection = null;
    }
    this.doc.destroy();
  }
}
