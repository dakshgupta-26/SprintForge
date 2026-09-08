import * as Y from 'yjs';
import { getSocket } from './socket';

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

export class MonacoYjsCollaboration {
  private doc: Y.Doc;
  private yText: Y.Text;
  private monaco: any;
  private editor: any;
  private projectId: string;
  private filePath: string;
  private isApplyingRemoteUpdate = false;
  private monacoBindingDisposables: any[] = [];
  private remoteCursors = new Map<string, RemoteCursorInfo>();
  private cursorDecorationsCollection: any = null;

  constructor(
    projectId: string,
    filePath: string,
    editor: any,
    monaco: any,
    initialContent?: string
  ) {
    this.projectId = projectId;
    this.filePath = filePath.replace(/\\/g, '/');
    this.editor = editor;
    this.monaco = monaco;
    this.doc = new Y.Doc();
    this.yText = this.doc.getText('monaco');

    if (initialContent && this.yText.length === 0) {
      this.doc.transact(() => {
        this.yText.insert(0, initialContent);
      });
    }

    this.initSocketEvents();
    this.bindEditorEvents();
  }

  private initSocketEvents() {
    const socket = getSocket();
    if (!socket) return;

    // Join file collaboration room
    const stateVector = Y.encodeStateVector(this.doc);
    socket.emit('code:join:file', {
      projectId: this.projectId,
      filePath: this.filePath,
      clientStateVector: Array.from(stateVector),
    });

    // 1. Receive Sync Step 2 diff from server
    const handleSyncStep2 = (data: { projectId: string; filePath: string; update: number[] }) => {
      if (data.projectId === this.projectId && data.filePath === this.filePath) {
        this.isApplyingRemoteUpdate = true;
        try {
          Y.applyUpdate(this.doc, new Uint8Array(data.update));
        } finally {
          this.isApplyingRemoteUpdate = false;
        }
      }
    };

    // 2. Receive incremental updates from collaborators
    const handleDocUpdate = (data: {
      projectId: string;
      filePath: string;
      update: number[];
      senderSocketId?: string;
    }) => {
      if (data.projectId === this.projectId && data.filePath === this.filePath) {
        if (data.senderSocketId === socket.id) return;
        this.isApplyingRemoteUpdate = true;
        try {
          Y.applyUpdate(this.doc, new Uint8Array(data.update));
        } finally {
          this.isApplyingRemoteUpdate = false;
        }
      }
    };

    // 3. Receive Remote Collaborator Awareness (Cursors & Selections)
    const handleAwarenessUpdate = (info: RemoteCursorInfo & { filePath: string }) => {
      if (info.filePath === this.filePath && info.socketId !== socket.id) {
        this.remoteCursors.set(info.socketId, info);
        this.renderRemoteCursors();
      }
    };

    // 4. Remote collaborator left file
    const handleAwarenessLeave = (data: { socketId: string; filePath: string }) => {
      if (data.filePath === this.filePath && this.remoteCursors.has(data.socketId)) {
        this.remoteCursors.delete(data.socketId);
        this.renderRemoteCursors();
      }
    };

    socket.on('code:sync:step2', handleSyncStep2);
    socket.on('code:doc:update', handleDocUpdate);
    socket.on('code:awareness:update', handleAwarenessUpdate);
    socket.on('code:awareness:leave', handleAwarenessLeave);

    // Track for cleanup
    this.monacoBindingDisposables.push({
      dispose: () => {
        socket.off('code:sync:step2', handleSyncStep2);
        socket.off('code:doc:update', handleDocUpdate);
        socket.off('code:awareness:update', handleAwarenessUpdate);
        socket.off('code:awareness:leave', handleAwarenessLeave);
        socket.emit('code:leave:file', {
          projectId: this.projectId,
          filePath: this.filePath,
        });
      },
    });
  }

  private bindEditorEvents() {
    const socket = getSocket();
    const model = this.editor.getModel();
    if (!model) return;

    // A. Yjs Text -> Monaco Model synchronization
    const handleYTextChange = (event: Y.YTextEvent) => {
      if (this.isApplyingRemoteUpdate) {
        // Apply remote changes to Monaco model buffer
        const newText = this.yText.toString();
        if (model.getValue() !== newText) {
          const fullRange = model.getFullModelRange();
          this.editor.executeEdits('yjs-remote', [
            {
              range: fullRange,
              text: newText,
              forceMoveMarkers: true,
            },
          ]);
        }
      }
    };

    this.yText.observe(handleYTextChange);

    // B. Monaco Model edits -> Yjs Document update & broadcast
    const contentListener = model.onDidChangeContent((e: any) => {
      if (this.isApplyingRemoteUpdate) return;

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
      });

      // Broadcast update to server and peers
      const update = Y.encodeStateAsUpdate(this.doc);
      if (socket?.connected) {
        socket.emit('code:doc:update', {
          projectId: this.projectId,
          filePath: this.filePath,
          update: Array.from(update),
        });
      }
    });

    this.monacoBindingDisposables.push(contentListener);

    // C. Cursor Position & Selection broadcast
    let cursorDebounce: any = null;
    const cursorListener = this.editor.onDidChangeCursorPosition((e: any) => {
      if (cursorDebounce) clearTimeout(cursorDebounce);
      cursorDebounce = setTimeout(() => {
        if (!socket?.connected) return;
        const selection = this.editor.getSelection();
        socket.emit('code:awareness:update', {
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
    if (!this.editor || !this.monaco) return;
    const model = this.editor.getModel();
    if (!model) return;

    const decorations: any[] = [];

    this.remoteCursors.forEach((remote) => {
      if (!remote.cursor) return;

      const { line, column } = remote.cursor;
      const color = remote.color || '#a855f7';

      // 1. Cursor line decoration
      decorations.push({
        range: new this.monaco.Range(line, column, line, column),
        options: {
          className: `remote-cursor-${remote.socketId}`,
          beforeContentClassName: `remote-cursor-head-${remote.socketId}`,
          hoverMessage: { value: `**${remote.userName}** (collaborating)` },
          stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
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
              stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            },
          });
        }
      }

      // Dynamically inject styling for remote cursor & selection
      this.injectCursorStyles(remote.socketId, color, remote.userName);
    });

    if (!this.cursorDecorationsCollection) {
      this.cursorDecorationsCollection = this.editor.createDecorationsCollection(decorations);
    } else {
      this.cursorDecorationsCollection.set(decorations);
    }
  }

  private injectCursorStyles(socketId: string, color: string, name: string) {
    const styleId = `cursor-style-${socketId}`;
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleTag) {
      styleTag = document.createElement('style');
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
    this.monacoBindingDisposables.forEach((d) => d.dispose?.());
    this.monacoBindingDisposables = [];
    if (this.cursorDecorationsCollection) {
      this.cursorDecorationsCollection.clear();
    }
    this.doc.destroy();
  }
}
