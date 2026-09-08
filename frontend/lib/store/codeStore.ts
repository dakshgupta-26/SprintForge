import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import { codeAPI } from '../api';
import { monacoModelManager } from '../monacoModelManager';

export const normalizePath = (filePath: string): string => {
  return filePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();
};

export const getAncestorFolders = (filePath: string): string[] => {
  const norm = normalizePath(filePath);
  const segments = norm.split('/');
  const ancestors: string[] = [];
  let current = '';
  for (let i = 0; i < segments.length - 1; i++) {
    current = current ? `${current}/${segments[i]}` : segments[i];
    ancestors.push(current);
  }
  return ancestors;
};

export interface FileTreeItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  extension?: string;
  modifiedAt?: Date;
  children?: FileTreeItem[];
}

export interface CodeTab {
  id: string; // File relative path
  title: string;
  path: string;
  language: string;
  isDirty?: boolean;
  isPinned?: boolean;
  content?: string;
  originalContent?: string;
}

export interface GitFileStatus {
  path: string;
  status: 'M' | 'A' | 'D' | 'U' | 'R' | 'C' | '?';
  staged: boolean;
}

export interface GitStatusSummary {
  branch: string;
  ahead: number;
  behind: number;
  isClean: boolean;
  files: GitFileStatus[];
  tracking?: string;
}

export interface CodeCollaborator {
  userId: string;
  name: string;
  avatar?: string;
  color: string;
  activeFile?: string;
  cursor?: { line: number; column: number };
  lastActive?: Date;
}

export interface TerminalTab {
  id: string;
  title: string;
  isActive: boolean;
}

export interface CodeProblem {
  id: string;
  file: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface IDESettings {
  fontSize: number;
  tabSize: number;
  fontFamily: string;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  bracketPairColorization: boolean;
  formatOnSave: boolean;
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  smoothScrolling: boolean;
  autoSave: 'off' | 'afterDelay' | 'onFocusChange';
  autoSaveDelay: number;
}

export const DEFAULT_IDE_SETTINGS: IDESettings = {
  fontSize: 13,
  tabSize: 2,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
  bracketPairColorization: true,
  formatOnSave: true,
  cursorStyle: 'line',
  cursorBlinking: 'smooth',
  smoothScrolling: true,
  autoSave: 'off',
  autoSaveDelay: 1000,
};

export type ActivityBarView =
  | 'explorer'
  | 'git'
  | 'search'
  | 'problems'
  | 'debug'
  | 'collab'
  | 'activity'
  | 'settings';

export type BottomPanelTab = 'problems' | 'output' | 'terminal' | 'debug';

interface CodeState {
  projectId: string | null;
  workspace: any | null;
  permission: 'VIEW' | 'EDIT' | 'WRITE';

  // File tree & Tabs
  fileTree: FileTreeItem[];
  expandedFolders: Set<string>;
  openTabs: CodeTab[];
  closedTabsHistory: CodeTab[];
  activeTabId: string | null;
  activeFileContent: string;
  isLoadingFile: boolean;

  // Search
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;

  // Git & Source Control
  gitStatus: GitStatusSummary | null;
  branches: { current: string; all: string[] } | null;
  activeDiff: { file?: string; diffText: string } | null;
  commitHistory: any[];
  isGitLoading: boolean;

  // Collaboration & Presence
  collaborators: CodeCollaborator[];
  syncStatus: 'synced' | 'syncing' | 'error' | 'reconnecting';

  // Terminal & Bottom Panel
  bottomPanelOpen: boolean;
  bottomPanelTab: BottomPanelTab;
  terminalOpen: boolean;
  terminalTabs: TerminalTab[];
  activeTerminalId: string;
  outputLogs: string[];
  debugLogs: string[];

  // Editor Diagnostics & Cursor
  problems: CodeProblem[];
  cursorPosition: { line: number; column: number; selectionCount?: number };
  ideSettings: IDESettings;

  // Layout & Navigation Modals
  activeActivityBarView: ActivityBarView;
  commandPaletteOpen: boolean;
  quickOpenOpen: boolean;
  githubModalOpen: boolean;
  permissionsModalOpen: boolean;
  settingsModalOpen: boolean;
  runDebugModalOpen: boolean;
  isSaving: boolean;
  loading: boolean;
  initError: string | null;

  // Actions
  initWorkspace: (projectId: string) => Promise<void>;
  loadFileTree: () => Promise<void>;
  toggleFolder: (folderPath: string) => void;
  expandFolder: (folderPath: string) => void;
  collapseAllFolders: () => void;
  openFile: (filePath: string, jumpToLine?: { line: number; column?: number }) => Promise<void>;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeTabsToTheRight: (tabId: string) => void;
  closeAllTabs: () => void;
  reopenClosedTab: () => void;
  pinTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  markTabDirty: (tabId: string, isDirty?: boolean) => void;
  updateActiveFileContent: (content: string, markDirty?: boolean) => void;
  saveActiveFile: (contentOverride?: string) => Promise<void>;

  // File CRUD
  createFile: (filePath: string) => Promise<boolean>;
  createFolder: (folderPath: string) => Promise<boolean>;
  renamePath: (oldPath: string, newPath: string) => Promise<boolean>;
  deletePath: (targetPath: string) => Promise<boolean>;
  duplicateFile: (sourcePath: string) => Promise<boolean>;

  // Real-time remote file sync
  handleRemoteFileCreated: (data: { path: string; type?: 'file' | 'folder' }) => void;
  handleRemoteFileDeleted: (data: { path: string }) => void;
  handleRemoteFileRenamed: (data: { oldPath: string; newPath: string }) => void;
  handleRemoteFileUpdated: (data: { path: string }) => void;

  // Search
  performSearch: (query: string, caseSensitive?: boolean, isRegex?: boolean) => Promise<void>;

  // Git Actions
  loadGitStatus: () => Promise<void>;
  loadGitDiff: (filePath?: string) => Promise<void>;
  loadGitBranches: () => Promise<void>;
  loadGitHistory: () => Promise<void>;
  commitChanges: (message: string, files?: string[]) => Promise<boolean>;
  switchBranch: (branch: string, create?: boolean) => Promise<boolean>;
  gitPull: () => Promise<boolean>;
  gitPush: (branch?: string) => Promise<boolean>;

  // Presence & Collab
  setCollaborators: (collaborators: CodeCollaborator[]) => void;
  setSyncStatus: (status: 'synced' | 'syncing' | 'error' | 'reconnecting') => void;

  // Terminal & Bottom Panel Actions
  toggleBottomPanel: (open?: boolean) => void;
  setBottomPanelTab: (tab: BottomPanelTab) => void;
  toggleTerminal: (open?: boolean) => void;
  addTerminalTab: () => string;
  closeTerminalTab: (id: string) => void;
  setActiveTerminalTab: (id: string) => void;
  addOutputLog: (log: string) => void;
  clearOutputLogs: () => void;
  addDebugLog: (log: string) => void;
  clearDebugLogs: () => void;

  // Diagnostics & Cursor
  setProblems: (problems: CodeProblem[]) => void;
  setCursorPosition: (pos: { line: number; column: number; selectionCount?: number }) => void;
  updateIDESettings: (newSettings: Partial<IDESettings>) => void;

  // Modals & View
  setActiveActivityBarView: (view: ActivityBarView) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickOpenOpen: (open: boolean) => void;
  setGithubModalOpen: (open: boolean) => void;
  setPermissionsModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setRunDebugModalOpen: (open: boolean) => void;
}

export const getLanguageFromPath = (filePath: string): string => {
  const norm = filePath.toLowerCase();
  const ext = norm.split('.').pop() || '';

  if (norm.endsWith('dockerfile') || norm.endsWith('.dockerignore')) return 'dockerfile';
  if (norm.endsWith('makefile')) return 'makefile';
  if (norm.endsWith('.env') || norm.startsWith('.env.')) return 'shell';

  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'mts':
    case 'cts':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
    case 'sass':
      return 'scss';
    case 'less':
      return 'less';
    case 'json':
    case 'json5':
    case 'jsonc':
      return 'json';
    case 'md':
    case 'markdown':
    case 'mdown':
      return 'markdown';
    case 'py':
    case 'pyw':
    case 'python':
      return 'python';
    case 'java':
    case 'class':
      return 'java';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'hpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'php':
    case 'phtml':
      return 'php';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'xml':
    case 'svg':
      return 'xml';
    case 'graphql':
    case 'gql':
      return 'graphql';
    case 'lua':
      return 'lua';
    case 'rb':
      return 'ruby';
    case 'swift':
      return 'swift';
    case 'kt':
    case 'kts':
      return 'kotlin';
    default:
      return 'plaintext';
  }
};

const getInitialSettings = (): IDESettings => {
  if (typeof window === 'undefined') return DEFAULT_IDE_SETTINGS;
  try {
    const saved = localStorage.getItem('sprintforge_ide_settings');
    if (saved) {
      return { ...DEFAULT_IDE_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_IDE_SETTINGS;
};

export const useCodeStore = create<CodeState>((set, get) => ({
  projectId: null,
  workspace: null,
  permission: 'VIEW',

  fileTree: [],
  expandedFolders: new Set(['src']),
  openTabs: [],
  closedTabsHistory: [],
  activeTabId: null,
  activeFileContent: '',
  isLoadingFile: false,

  searchQuery: '',
  searchResults: [],
  isSearching: false,

  gitStatus: null,
  branches: null,
  activeDiff: null,
  commitHistory: [],
  isGitLoading: false,

  collaborators: [],
  syncStatus: 'synced',

  bottomPanelOpen: false,
  bottomPanelTab: 'terminal',
  terminalOpen: false,
  terminalTabs: [{ id: 'term-1', title: 'Terminal 1', isActive: true }],
  activeTerminalId: 'term-1',
  outputLogs: [
    '[SprintForge IDE] Workspace environment ready.',
    '[Language Server] TypeScript / JavaScript compiler service connected.',
  ],
  debugLogs: [],

  problems: [],
  cursorPosition: { line: 1, column: 1 },
  ideSettings: getInitialSettings(),

  activeActivityBarView: 'explorer',
  commandPaletteOpen: false,
  quickOpenOpen: false,
  githubModalOpen: false,
  permissionsModalOpen: false,
  settingsModalOpen: false,
  runDebugModalOpen: false,
  isSaving: false,
  loading: true,
  initError: null,

  initWorkspace: async (projectId: string) => {
    set({ projectId, loading: true, initError: null });
    try {
      const { data } = await codeAPI.getWorkspace(projectId);
      set({
        workspace: data.workspace,
        permission: data.permission || 'VIEW',
        loading: false,
        initError: null,
      });

      // Load file tree and git status in parallel
      await Promise.all([get().loadFileTree(), get().loadGitStatus(), get().loadGitBranches()]);

      // If README.md or src/index.ts exists, open it automatically if no tab is currently open
      const tree = get().fileTree;
      if (get().openTabs.length === 0) {
        const initialFile =
          tree.find((t) => t.path === 'README.md') ||
          tree.find((t) => t.path === 'src/index.ts' || t.path === 'index.ts') ||
          tree.find((t) => t.type === 'file');
        if (initialFile) {
          await get().openFile(initialFile.path);
        }
      }
    } catch (err: any) {
      console.error('[CODE_WORKSPACE] Init error:', err);
      set({
        loading: false,
        initError: err?.response?.data?.message || err?.message || 'Failed to initialize workspace',
      });
    }
  },

  loadFileTree: async () => {
    const { projectId } = get();
    if (!projectId) return;
    try {
      const { data } = await codeAPI.getFileTree(projectId);
      set({ fileTree: data.tree || [] });
    } catch (err) {
      console.error('[CODE_WORKSPACE] Error loading file tree:', err);
    }
  },

  toggleFolder: (folderPath: string) => {
    const norm = normalizePath(folderPath);
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(norm)) {
        next.delete(norm);
      } else {
        next.add(norm);
      }
      return { expandedFolders: next };
    });
  },

  expandFolder: (folderPath: string) => {
    const norm = normalizePath(folderPath);
    set((state) => {
      const next = new Set(state.expandedFolders);
      next.add(norm);
      return { expandedFolders: next };
    });
  },

  collapseAllFolders: () => {
    set({ expandedFolders: new Set() });
  },

  openFile: async (filePath: string, jumpToLine?: { line: number; column?: number }) => {
    const { projectId, openTabs } = get();
    if (!projectId || !filePath) return;

    const normalized = normalizePath(filePath);

    // Auto-expand parent folders in file tree
    const ancestors = getAncestorFolders(normalized);
    if (ancestors.length > 0) {
      set((state) => {
        const next = new Set(state.expandedFolders);
        ancestors.forEach((a) => next.add(a));
        return { expandedFolders: next };
      });
    }

    // Check if tab already open
    const existing = openTabs.find((t) => t.id === normalized);
    if (existing) {
      set({
        activeTabId: normalized,
        activeFileContent: existing.content || '',
      });

      if (jumpToLine) {
        set({
          cursorPosition: {
            line: jumpToLine.line,
            column: jumpToLine.column || 1,
          },
        });
      }
      return;
    }

    set({ isLoadingFile: true });
    try {
      const { data } = await codeAPI.readFile(projectId, normalized);
      const language = getLanguageFromPath(normalized);
      const title = normalized.split('/').pop() || normalized;
      const fileContent = typeof data.content === 'string' ? data.content : '';

      const newTab: CodeTab = {
        id: normalized,
        title,
        path: normalized,
        language,
        content: fileContent,
        originalContent: fileContent,
        isDirty: false,
      };

      set((state) => {
        const tabExists = state.openTabs.some((t) => t.id === normalized);
        return {
          openTabs: tabExists ? state.openTabs : [...state.openTabs, newTab],
          activeTabId: normalized,
          activeFileContent: fileContent,
          isLoadingFile: false,
          cursorPosition: jumpToLine
            ? { line: jumpToLine.line, column: jumpToLine.column || 1 }
            : state.cursorPosition,
        };
      });
    } catch (err: any) {
      console.error(`[CODE_WORKSPACE] Error reading file ${normalized}:`, err);
      toast.error(err?.response?.data?.message || `Unable to open ${normalized}`);
      set({ isLoadingFile: false });
    }
  },

  closeTab: (tabId: string) => {
    const { projectId, openTabs } = get();
    const normalized = normalizePath(tabId);
    const tabToClose = openTabs.find((t) => t.id === normalized);

    if (projectId) {
      monacoModelManager.disposeFile(null, projectId, normalized);
    }

    set((state) => {
      const newTabs = state.openTabs.filter((t) => t.id !== normalized);
      let nextActiveId = state.activeTabId;

      if (state.activeTabId === normalized) {
        if (newTabs.length > 0) {
          const closedIdx = state.openTabs.findIndex((t) => t.id === normalized);
          const nextIdx = Math.min(closedIdx, newTabs.length - 1);
          nextActiveId = newTabs[nextIdx].id;
        } else {
          nextActiveId = null;
        }
      }

      const nextActiveTab = newTabs.find((t) => t.id === nextActiveId);

      return {
        openTabs: newTabs,
        closedTabsHistory: tabToClose
          ? [tabToClose, ...state.closedTabsHistory.slice(0, 15)]
          : state.closedTabsHistory,
        activeTabId: nextActiveId,
        activeFileContent: nextActiveTab?.content || '',
      };
    });
  },

  closeOtherTabs: (tabId: string) => {
    const { projectId, openTabs } = get();
    const normalized = normalizePath(tabId);
    if (projectId) {
      openTabs.forEach((t) => {
        if (t.id !== normalized) {
          monacoModelManager.disposeFile(null, projectId, t.id);
        }
      });
    }

    set((state) => {
      const target = state.openTabs.find((t) => t.id === normalized);
      if (!target) return state;
      return {
        openTabs: [target],
        activeTabId: target.id,
        activeFileContent: target.content || '',
      };
    });
  },

  closeTabsToTheRight: (tabId: string) => {
    const { projectId, openTabs } = get();
    const normalized = normalizePath(tabId);
    const targetIdx = openTabs.findIndex((t) => t.id === normalized);
    if (targetIdx === -1) return;

    const toClose = openTabs.slice(targetIdx + 1);
    if (projectId) {
      toClose.forEach((t) => monacoModelManager.disposeFile(null, projectId, t.id));
    }

    const remaining = openTabs.slice(0, targetIdx + 1);
    const activeIsRemaining = remaining.some((t) => t.id === get().activeTabId);

    set({
      openTabs: remaining,
      activeTabId: activeIsRemaining ? get().activeTabId : normalized,
    });
  },

  closeAllTabs: () => {
    const { projectId } = get();
    if (projectId) {
      monacoModelManager.disposeProject(null, projectId);
    }
    set({
      openTabs: [],
      activeTabId: null,
      activeFileContent: '',
    });
  },

  reopenClosedTab: () => {
    const { closedTabsHistory } = get();
    if (closedTabsHistory.length === 0) return;
    const [mostRecent, ...rest] = closedTabsHistory;
    set({ closedTabsHistory: rest });
    get().openFile(mostRecent.path);
  },

  pinTab: (tabId: string) => {
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.id === tabId ? { ...t, isPinned: !t.isPinned } : t
      ),
    }));
  },

  setActiveTab: (tabId: string) => {
    const tab = get().openTabs.find((t) => t.id === tabId);
    if (tab) {
      set({
        activeTabId: tabId,
        activeFileContent: tab.content || '',
      });
    }
  },

  markTabDirty: (tabId: string, isDirty = true) => {
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.id === tabId ? { ...t, isDirty } : t
      ),
    }));
  },

  updateActiveFileContent: (content: string, markDirty = true) => {
    const { activeTabId } = get();
    if (!activeTabId) return;

    set((state) => ({
      activeFileContent: content,
      openTabs: state.openTabs.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              content,
              isDirty: markDirty ? content !== t.originalContent : t.isDirty,
            }
          : t
      ),
    }));
  },

  saveActiveFile: async (contentOverride?: string) => {
    const { projectId, activeTabId, openTabs, permission } = get();
    if (!projectId || !activeTabId || permission === 'VIEW') return;

    const activeTab = openTabs.find((t) => t.id === activeTabId);
    let contentToSave: string;
    if (contentOverride !== undefined) {
      contentToSave = contentOverride;
    } else {
      const model = monacoModelManager.getModel(projectId, activeTabId);
      if (model && !model.isDisposed()) {
        contentToSave = model.getValue();
      } else {
        contentToSave = activeTab?.content || '';
      }
    }

    set({ isSaving: true });
    try {
      await codeAPI.writeFile(projectId, activeTabId, contentToSave);

      set((state) => ({
        isSaving: false,
        openTabs: state.openTabs.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                isDirty: false,
                content: contentToSave,
                originalContent: contentToSave,
              }
            : t
        ),
        activeFileContent: contentToSave,
      }));

      // Refresh git status after saving
      get().loadGitStatus();
      get().addOutputLog(`[Save] File saved: ${activeTabId} (${new Date().toLocaleTimeString()})`);
    } catch {
      set({ isSaving: false });
    }
  },

  createFile: async (filePath: string) => {
    const { projectId } = get();
    if (!projectId || !filePath.trim()) return false;

    const normalized = normalizePath(filePath);

    try {
      await codeAPI.createFile(projectId, normalized);

      // Auto-expand all parent folders
      const ancestors = getAncestorFolders(normalized);
      if (ancestors.length > 0) {
        set((state) => {
          const next = new Set(state.expandedFolders);
          ancestors.forEach((a) => next.add(a));
          return { expandedFolders: next };
        });
      }

      await get().loadFileTree();
      await get().openFile(normalized);
      get().addOutputLog(`[File] Created file: ${normalized}`);
      return true;
    } catch (err: any) {
      console.error('[CODE_WORKSPACE] Create file error:', err);
      const msg = err?.response?.data?.message || `Unable to create ${normalized}`;
      toast.error(msg);
      return false;
    }
  },

  createFolder: async (folderPath: string) => {
    const { projectId } = get();
    if (!projectId || !folderPath.trim()) return false;

    const normalized = normalizePath(folderPath);

    try {
      await codeAPI.createFolder(projectId, normalized);

      // Auto-expand parent folders and the newly created folder
      const ancestors = getAncestorFolders(normalized);
      set((state) => {
        const next = new Set(state.expandedFolders);
        ancestors.forEach((a) => next.add(a));
        next.add(normalized);
        return { expandedFolders: next };
      });

      await get().loadFileTree();
      get().addOutputLog(`[Folder] Created directory: ${normalized}`);
      return true;
    } catch (err: any) {
      console.error('[CODE_WORKSPACE] Create folder error:', err);
      const msg = err?.response?.data?.message || `Unable to create folder ${normalized}`;
      toast.error(msg);
      return false;
    }
  },

  renamePath: async (oldPath: string, newPath: string) => {
    const { projectId } = get();
    if (!projectId || !oldPath || !newPath) return false;

    const normOld = normalizePath(oldPath);
    const normNew = normalizePath(newPath);

    try {
      await codeAPI.renamePath(projectId, normOld, normNew);
      monacoModelManager.renameModel(projectId, normOld, normNew);

      // Auto-expand ancestors of new path
      const ancestors = getAncestorFolders(normNew);
      if (ancestors.length > 0) {
        set((state) => {
          const next = new Set(state.expandedFolders);
          ancestors.forEach((a) => next.add(a));
          return { expandedFolders: next };
        });
      }

      await get().loadFileTree();

      // Update open tabs
      set((state) => ({
        openTabs: state.openTabs.map((t) =>
          t.id === normOld
            ? {
                ...t,
                id: normNew,
                path: normNew,
                title: normNew.split('/').pop() || normNew,
                language: getLanguageFromPath(normNew),
              }
            : t
        ),
        activeTabId: state.activeTabId === normOld ? normNew : state.activeTabId,
      }));
      get().addOutputLog(`[Rename] ${normOld} -> ${normNew}`);
      return true;
    } catch (err: any) {
      console.error('[CODE_WORKSPACE] Rename error:', err);
      const msg = err?.response?.data?.message || `Unable to rename path`;
      toast.error(msg);
      return false;
    }
  },

  deletePath: async (targetPath: string) => {
    const { projectId } = get();
    if (!projectId || !targetPath) return false;

    const normTarget = normalizePath(targetPath);

    try {
      await codeAPI.deletePath(projectId, normTarget);
      monacoModelManager.disposeFile(null, projectId, normTarget);
      await get().loadFileTree();
      get().closeTab(normTarget);
      get().addOutputLog(`[Delete] Removed ${normTarget}`);
      return true;
    } catch (err: any) {
      console.error('[CODE_WORKSPACE] Delete error:', err);
      const msg = err?.response?.data?.message || `Unable to delete ${normTarget}`;
      toast.error(msg);
      return false;
    }
  },

  duplicateFile: async (sourcePath: string) => {
    const { projectId } = get();
    if (!projectId || !sourcePath) return false;

    const normSource = normalizePath(sourcePath);

    try {
      const { data } = await codeAPI.duplicatePath(projectId, normSource);
      await get().loadFileTree();
      if (data.path) {
        await get().openFile(data.path);
      }
      get().addOutputLog(`[Duplicate] Copied ${normSource} -> ${data.path}`);
      return true;
    } catch (err: any) {
      console.error('[CODE_WORKSPACE] Duplicate error:', err);
      const msg = err?.response?.data?.message || `Unable to duplicate file`;
      toast.error(msg);
      return false;
    }
  },

  handleRemoteFileCreated: (data: { path: string; type?: 'file' | 'folder' }) => {
    const ancestors = getAncestorFolders(data.path);
    if (ancestors.length > 0) {
      set((state) => {
        const next = new Set(state.expandedFolders);
        ancestors.forEach((a) => next.add(a));
        return { expandedFolders: next };
      });
    }
    get().loadFileTree();
  },

  handleRemoteFileDeleted: (data: { path: string }) => {
    const { projectId } = get();
    const norm = normalizePath(data.path);
    if (projectId) {
      monacoModelManager.disposeFile(null, projectId, norm);
    }
    get().closeTab(norm);
    get().loadFileTree();
  },

  handleRemoteFileRenamed: (data: { oldPath: string; newPath: string }) => {
    const { projectId } = get();
    const normOld = normalizePath(data.oldPath);
    const normNew = normalizePath(data.newPath);

    if (projectId) {
      monacoModelManager.renameModel(projectId, normOld, normNew);
    }

    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.id === normOld
          ? {
              ...t,
              id: normNew,
              path: normNew,
              title: normNew.split('/').pop() || normNew,
              language: getLanguageFromPath(normNew),
            }
          : t
      ),
      activeTabId: state.activeTabId === normOld ? normNew : state.activeTabId,
    }));

    get().loadFileTree();
  },

  handleRemoteFileUpdated: () => {
    get().loadGitStatus();
  },

  performSearch: async (query: string, caseSensitive = false, isRegex = false) => {
    const { projectId } = get();
    if (!projectId || !query.trim()) {
      set({ searchResults: [], searchQuery: query, isSearching: false });
      return;
    }

    set({ isSearching: true, searchQuery: query });
    try {
      const { data } = await codeAPI.searchFiles(projectId, query, caseSensitive, isRegex);
      set({ searchResults: data.results || [], isSearching: false });
    } catch {
      set({ isSearching: false, searchResults: [] });
    }
  },

  loadGitStatus: async () => {
    const { projectId } = get();
    if (!projectId) return;
    try {
      const { data } = await codeAPI.getGitStatus(projectId);
      set({ gitStatus: data });
    } catch {}
  },

  loadGitDiff: async (filePath?: string) => {
    const { projectId } = get();
    if (!projectId) return;
    try {
      const { data } = await codeAPI.getGitDiff(projectId, filePath);
      set({ activeDiff: { file: filePath, diffText: data.diff || '' } });
    } catch {}
  },

  loadGitBranches: async () => {
    const { projectId } = get();
    if (!projectId) return;
    try {
      const { data } = await codeAPI.getBranches(projectId);
      set({ branches: data });
    } catch {}
  },

  loadGitHistory: async () => {
    const { projectId } = get();
    if (!projectId) return;
    try {
      const { data } = await codeAPI.getGitHistory(projectId, 40);
      set({ commitHistory: data.history || [] });
    } catch {}
  },

  commitChanges: async (message: string, files?: string[]) => {
    const { projectId } = get();
    if (!projectId) return false;
    set({ isGitLoading: true });
    try {
      await codeAPI.commit(projectId, message, files);
      await Promise.all([get().loadGitStatus(), get().loadGitHistory()]);
      set({ isGitLoading: false });
      get().addOutputLog(`[Git] Committed: "${message}"`);
      return true;
    } catch {
      set({ isGitLoading: false });
      return false;
    }
  },

  switchBranch: async (branch: string, create = false) => {
    const { projectId } = get();
    if (!projectId) return false;
    set({ isGitLoading: true });
    try {
      await codeAPI.switchOrCreateBranch(projectId, branch, create);
      await Promise.all([
        get().loadGitBranches(),
        get().loadGitStatus(),
        get().loadFileTree(),
      ]);
      set({ isGitLoading: false });
      get().addOutputLog(`[Git] Switched to branch ${branch}${create ? ' (new)' : ''}`);
      return true;
    } catch {
      set({ isGitLoading: false });
      return false;
    }
  },

  gitPull: async () => {
    const { projectId } = get();
    if (!projectId) return false;
    set({ isGitLoading: true });
    try {
      await codeAPI.gitPull(projectId);
      await Promise.all([
        get().loadGitStatus(),
        get().loadFileTree(),
        get().loadGitHistory(),
      ]);
      set({ isGitLoading: false });
      get().addOutputLog('[Git] Pulled changes from origin.');
      return true;
    } catch {
      set({ isGitLoading: false });
      return false;
    }
  },

  gitPush: async (branch?: string) => {
    const { projectId } = get();
    if (!projectId) return false;
    set({ isGitLoading: true });
    try {
      await codeAPI.gitPush(projectId, branch);
      await get().loadGitStatus();
      set({ isGitLoading: false });
      get().addOutputLog('[Git] Pushed changes to origin.');
      return true;
    } catch {
      set({ isGitLoading: false });
      return false;
    }
  },

  setCollaborators: (collaborators: CodeCollaborator[]) => {
    set({ collaborators });
  },

  setSyncStatus: (status: 'synced' | 'syncing' | 'error' | 'reconnecting') => {
    set({ syncStatus: status });
  },

  toggleBottomPanel: (open?: boolean) => {
    set((state) => {
      const next = open !== undefined ? open : !state.bottomPanelOpen;
      return {
        bottomPanelOpen: next,
        terminalOpen: next,
      };
    });
  },

  setBottomPanelTab: (tab: BottomPanelTab) => {
    set({
      bottomPanelTab: tab,
      bottomPanelOpen: true,
      terminalOpen: true,
    });
  },

  toggleTerminal: (open?: boolean) => {
    set((state) => {
      const next = open !== undefined ? open : !state.terminalOpen;
      return {
        terminalOpen: next,
        bottomPanelOpen: next,
        bottomPanelTab: next ? 'terminal' : state.bottomPanelTab,
      };
    });
  },

  addTerminalTab: () => {
    const id = `term-${Date.now()}`;
    set((state) => ({
      bottomPanelOpen: true,
      terminalOpen: true,
      bottomPanelTab: 'terminal',
      terminalTabs: [
        ...state.terminalTabs.map((t) => ({ ...t, isActive: false })),
        { id, title: `Terminal ${state.terminalTabs.length + 1}`, isActive: true },
      ],
      activeTerminalId: id,
    }));
    return id;
  },

  closeTerminalTab: (id: string) => {
    set((state) => {
      const remaining = state.terminalTabs.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        return {
          terminalTabs: [],
          activeTerminalId: '',
          bottomPanelOpen: false,
          terminalOpen: false,
        };
      }
      return {
        terminalTabs: remaining.map((t, idx) => ({ ...t, isActive: idx === 0 })),
        activeTerminalId: remaining[0].id,
      };
    });
  },

  setActiveTerminalTab: (id: string) => {
    set((state) => ({
      terminalTabs: state.terminalTabs.map((t) => ({ ...t, isActive: t.id === id })),
      activeTerminalId: id,
    }));
  },

  addOutputLog: (log: string) => {
    set((state) => ({
      outputLogs: [...state.outputLogs.slice(-150), log],
    }));
  },

  clearOutputLogs: () => set({ outputLogs: [] }),

  addDebugLog: (log: string) => {
    set((state) => ({
      debugLogs: [...state.debugLogs.slice(-150), log],
    }));
  },

  clearDebugLogs: () => set({ debugLogs: [] }),

  setProblems: (problems: CodeProblem[]) => {
    set({ problems });
  },

  setCursorPosition: (pos: { line: number; column: number; selectionCount?: number }) => {
    set({ cursorPosition: pos });
  },

  updateIDESettings: (newSettings: Partial<IDESettings>) => {
    set((state) => {
      const updated = { ...state.ideSettings, ...newSettings };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sprintforge_ide_settings', JSON.stringify(updated));
        } catch {}
      }
      return { ideSettings: updated };
    });
  },

  setActiveActivityBarView: (view: ActivityBarView) => {
    set({ activeActivityBarView: view });
  },

  setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),
  setQuickOpenOpen: (open: boolean) => set({ quickOpenOpen: open }),
  setGithubModalOpen: (open: boolean) => set({ githubModalOpen: open }),
  setPermissionsModalOpen: (open: boolean) => set({ permissionsModalOpen: open }),
  setSettingsModalOpen: (open: boolean) => set({ settingsModalOpen: open }),
  setRunDebugModalOpen: (open: boolean) => set({ runDebugModalOpen: open }),
}));
