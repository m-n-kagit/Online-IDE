import { create } from 'zustand';

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  content?: string;
}

interface StoreState {
  sessionId: string | null;
  sessionStatus: 'idle' | 'restoring' | 'saving' | 'saved' | 'error';
  setSessionId: (sessionId: string) => void;
  setSessionStatus: (status: StoreState['sessionStatus']) => void;

  // File System
  fileTree: FileTreeNode[];
  setFileTree: (tree: FileTreeNode[]) => void;
  
  // Editor
  openFiles: string[];
  activeFile: string | null;
  fileContents: Record<string, string>;
  openFile: (path: string, content: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  
  // Terminal
  terminalOutput: string;
  addTerminalOutput: (output: string) => void;
  clearTerminal: () => void;
  
  // Preview
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  
  // Status
  isBooting: boolean;
  isInstalling: boolean;
  isRunning: boolean;
  setBooting: (value: boolean) => void;
  setInstalling: (value: boolean) => void;
  setRunning: (value: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  sessionId: null,
  sessionStatus: 'idle',
  setSessionId: (sessionId) => set({ sessionId }),
  setSessionStatus: (sessionStatus) => set({ sessionStatus }),

  // File System
  fileTree: [],
  setFileTree: (tree) => set({ fileTree: tree }),
  
  // Editor
  openFiles: [],
  activeFile: null,
  fileContents: {},
  openFile: (path, content) =>
    set((state) => ({
      openFiles: state.openFiles.includes(path) ? state.openFiles : [...state.openFiles, path],
      activeFile: path,
      fileContents: { ...state.fileContents, [path]: content },
    })),
  closeFile: (path) =>
    set((state) => {
      const newOpenFiles = state.openFiles.filter((f) => f !== path);
      const newFileContents = { ...state.fileContents };
      delete newFileContents[path];
      return {
        openFiles: newOpenFiles,
        activeFile: state.activeFile === path ? newOpenFiles[0] || null : state.activeFile,
        fileContents: newFileContents,
      };
    }),
  setActiveFile: (path) => set({ activeFile: path }),
  updateFileContent: (path, content) =>
    set((state) => ({
      fileContents: { ...state.fileContents, [path]: content },
    })),
  
  // Terminal
  terminalOutput: '',
  addTerminalOutput: (output) =>
    set((state) => ({
      terminalOutput: state.terminalOutput + output,
    })),
  clearTerminal: () => set({ terminalOutput: '' }),
  
  // Preview
  previewUrl: null,
  setPreviewUrl: (url) => set({ previewUrl: url }),
  
  // Status
  isBooting: false,
  isInstalling: false,
  isRunning: false,
  setBooting: (value) => set({ isBooting: value }),
  setInstalling: (value) => set({ isInstalling: value }),
  setRunning: (value) => set({ isRunning: value }),
}));
