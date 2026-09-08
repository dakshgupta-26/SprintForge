import { create } from 'zustand';
import { codeAPI } from '../api';

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

export type ActivityBarView =
  | 'explorer'
  | 'git'
  | 'search'
  | 'collab'
  | 'activity'
  | 'settings';

interface CodeState {
  projectId: string | null;
  workspace: any | null;
  permission: 'VIEW' | 'EDIT' | 'WRITE';

  // File tree & Tabs
  fileTree: FileTreeItem[];
  expandedFolders: Set<string>;
  openTabs: CodeTab[];
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

  // Terminal
  terminalOpen: boolean;
  terminalTabs: TerminalTab[];
  activeTerminalId: string;

  // Layout & Navigation Modals
  activeActivityBarView: ActivityBarView;
  commandPaletteOpen: boolean;
  quickOpenOpen: boolean;
  githubModalOpen: boolean;
  permissionsModalOpen: boolean;
  isSaving: boolean;
  loading: boolean;

  // Actions
  initWorkspace: (projectId: string) => Promise<void>;
  loadFileTree: () => Promise<void>;
  toggleFolder: (folderPath: string) => void;
  openFile: (filePath: string) => Promise<void>;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  pinTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateActiveFileContent: (content: string, markDirty?: boolean) => void;
  saveActiveFile: () => Promise<void>;

  // File CRUD
  createFile: (filePath: string) => Promise<boolean>;
  createFolder: (folderPath: string) => Promise<boolean>;
  renamePath: (oldPath: string, newPath: string) => Promise<boolean>;
  deletePath: (targetPath: string) => Promise<boolean>;
  duplicateFile: (sourcePath: string) => Promise<boolean>;

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

  // Terminal actions
  toggleTerminal: (open?: boolean) => void;
  addTerminalTab: () => string;
  closeTerminalTab: (id: string) => void;
  setActiveTerminalTab: (id: string) => void;

  // Modals & View
  setActiveActivityBarView: (view: ActivityBarView) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setQuickOpenOpen: (open: boolean) => void;
  setGithubModalOpen: (open: boolean) => void;
  setPermissionsModalOpen: (open: boolean) => void;
}

export const getLanguageFromPath = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'jsx':
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
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'hpp':
    case 'cc':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'php':
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
    case 'dockerfile':
      return 'dockerfile';
    default:
      return 'plaintext';
  }
};

export const useCodeStore = create<CodeState>((set, get) => ({
  projectId: null,
  workspace: null,
  permission: 'VIEW',

  fileTree: [],
  expandedFolders: new Set(['src']),
  openTabs: [],
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

  terminalOpen: false,
  terminalTabs: [{ id: 'term-1', title: 'Terminal 1', isActive: true }],
  activeTerminalId: 'term-1',

  activeActivityBarView: 'explorer',
  commandPaletteOpen: false,
  quickOpenOpen: false,
  githubModalOpen: false,
  permissionsModalOpen: false,
  isSaving: false,
  loading: true,

  initWorkspace: async (projectId: string) => {
    set({ projectId, loading: true });
    try {
      const { data } = await codeAPI.getWorkspace(projectId);
      set({
        workspace: data.workspace,
        permission: data.permission || 'VIEW',
        loading: false,
      });

      // Load file tree and git status in parallel
      await Promise.all([get().loadFileTree(), get().loadGitStatus(), get().loadGitBranches()]);

      // If README.md or src/index.ts exists, open it automatically
      const tree = get().fileTree;
      const initialFile = tree.find((t) => t.path === 'README.md') || tree.find((t) => t.type === 'file');
      if (initialFile && get().openTabs.length === 0) {
        get().openFile(initialFile.path);
      }
    } catch {
      set({ loading: false });
    }
  },

  loadFileTree: async () => {
    const { projectId } = get();
    if (!projectId) return;
    try {
      const { data } = await codeAPI.getFileTree(projectId);
      set({ fileTree: data.tree || [] });
    } catch {}
  },

  toggleFolder: (folderPath: string) => {
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return { expandedFolders: next };
    });
  },

  openFile: async (filePath: string) => {
    const { projectId, openTabs } = get();
    if (!projectId) return;

    const normalized = filePath.replace(/\\/g, '/');

    // Check if tab already open
    const existing = openTabs.find((t) => t.id === normalized);
    if (existing) {
      set({
        activeTabId: normalized,
        activeFileContent: existing.content || '',
      });
      return;
    }

    set({ isLoadingFile: true });
    try {
      const { data } = await codeAPI.readFile(projectId, normalized);
      const language = getLanguageFromPath(normalized);
      const title = normalized.split('/').pop() || normalized;

      const newTab: CodeTab = {
        id: normalized,
        title,
        path: normalized,
        language,
        content: data.content,
        originalContent: data.content,
        isDirty: false,
      };

      set((state) => ({
        openTabs: [...state.openTabs, newTab],
        activeTabId: normalized,
        activeFileContent: data.content,
        isLoadingFile: false,
      }));
    } catch {
      set({ isLoadingFile: false });
    }
  },

  closeTab: (tabId: string) => {
    set((state) => {
      const newTabs = state.openTabs.filter((t) => t.id !== tabId);
      let nextActiveId = state.activeTabId;

      if (state.activeTabId === tabId) {
        if (newTabs.length > 0) {
          const closedIdx = state.openTabs.findIndex((t) => t.id === tabId);
          const nextIdx = Math.min(closedIdx, newTabs.length - 1);
          nextActiveId = newTabs[nextIdx].id;
        } else {
          nextActiveId = null;
        }
      }

      const nextActiveTab = newTabs.find((t) => t.id === nextActiveId);

      return {
        openTabs: newTabs,
        activeTabId: nextActiveId,
        activeFileContent: nextActiveTab?.content || '',
      };
    });
  },

  closeOtherTabs: (tabId: string) => {
    set((state) => {
      const target = state.openTabs.find((t) => t.id === tabId);
      if (!target) return state;
      return {
        openTabs: [target],
        activeTabId: target.id,
        activeFileContent: target.content || '',
      };
    });
  },

  closeAllTabs: () => {
    set({
      openTabs: [],
      activeTabId: null,
      activeFileContent: '',
    });
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

  saveActiveFile: async () => {
    const { projectId, activeTabId, activeFileContent, permission } = get();
    if (!projectId || !activeTabId || permission === 'VIEW') return;

    set({ isSaving: true });
    try {
      await codeAPI.writeFile(projectId, activeTabId, activeFileContent);

      set((state) => ({
        isSaving: false,
        openTabs: state.openTabs.map((t) =>
          t.id === activeTabId
            ? { ...t, isDirty: false, originalContent: activeFileContent }
            : t
        ),
      }));

      // Refresh git status after saving
      get().loadGitStatus();
    } catch {
      set({ isSaving: false });
    }
  },

  createFile: async (filePath: string) => {
    const { projectId } = get();
    if (!projectId) return false;
    try {
      await codeAPI.createFile(projectId, filePath);
      await get().loadFileTree();
      await get().openFile(filePath);
      return true;
    } catch {
      return false;
    }
  },

  createFolder: async (folderPath: string) => {
    const { projectId } = get();
    if (!projectId) return false;
    try {
      await codeAPI.createFolder(projectId, folderPath);
      await get().loadFileTree();
      return true;
    } catch {
      return false;
    }
  },

  renamePath: async (oldPath: string, newPath: string) => {
    const { projectId } = get();
    if (!projectId) return false;
    try {
      await codeAPI.renamePath(projectId, oldPath, newPath);
      await get().loadFileTree();

      // Update open tabs
      set((state) => ({
        openTabs: state.openTabs.map((t) =>
          t.id === oldPath
            ? {
                ...t,
                id: newPath,
                path: newPath,
                title: newPath.split('/').pop() || newPath,
                language: getLanguageFromPath(newPath),
              }
            : t
        ),
        activeTabId: state.activeTabId === oldPath ? newPath : state.activeTabId,
      }));
      return true;
    } catch {
      return false;
    }
  },

  deletePath: async (targetPath: string) => {
    const { projectId } = get();
    if (!projectId) return false;
    try {
      await codeAPI.deletePath(projectId, targetPath);
      await get().loadFileTree();
      get().closeTab(targetPath);
      return true;
    } catch {
      return false;
    }
  },

  duplicateFile: async (sourcePath: string) => {
    const { projectId } = get();
    if (!projectId) return false;
    try {
      const { data } = await codeAPI.duplicatePath(projectId, sourcePath);
      await get().loadFileTree();
      if (data.path) {
        await get().openFile(data.path);
      }
      return true;
    } catch {
      return false;
    }
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
      return true;
    } catch {
      set({ isGitLoading: false });
      return false;
    }
  },

  setCollaborators: (collaborators: CodeCollaborator[]) => {
    set({ collaborators });
  },

  toggleTerminal: (open?: boolean) => {
    set((state) => ({
      terminalOpen: open !== undefined ? open : !state.terminalOpen,
    }));
  },

  addTerminalTab: () => {
    const id = `term-${Date.now()}`;
    set((state) => ({
      terminalOpen: true,
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

  setActiveActivityBarView: (view: ActivityBarView) => {
    set({ activeActivityBarView: view });
  },

  setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),
  setQuickOpenOpen: (open: boolean) => set({ quickOpenOpen: open }),
  setGithubModalOpen: (open: boolean) => set({ githubModalOpen: open }),
  setPermissionsModalOpen: (open: boolean) => set({ permissionsModalOpen: open }),
}));
