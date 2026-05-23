import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  Trash2,
} from 'lucide-react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { FileTreeNode, useStore } from '../store/useStore';
import { readFile } from '../webcontainer/webcontainer';
import { createFile, createDirectory, deleteFile } from '../webcontainer/fileOperations';
import { buildFileTree } from '../webcontainer/fileWatcher';
import { persistSessionSnapshot } from '../webcontainer/sessionPersistence';

interface FileTreeItemProps {
  node: FileTreeNode;
  level: number;
}

function getSiblingOrChildPath(node: FileTreeNode, itemName: string): string {
  if (node.type === 'directory') {
    return `${node.path}/${itemName}`;
  }

  const separatorIndex = node.path.lastIndexOf('/');
  return separatorIndex === -1 ? itemName : `${node.path.slice(0, separatorIndex)}/${itemName}`;
}

async function syncSession(
  sessionId: string | null,
  setSessionStatus: (status: 'idle' | 'restoring' | 'saving' | 'saved' | 'error') => void
): Promise<void> {
  if (!sessionId) return;

  try {
    setSessionStatus('saving');
    await persistSessionSnapshot(sessionId);
    setSessionStatus('saved');
  } catch (error) {
    console.error('Failed to persist session:', error);
    setSessionStatus('error');
  }
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, level }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { openFile, activeFile, sessionId, setFileTree, setSessionStatus } = useStore();
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleClick = async () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded);
      return;
    }

    try {
      const content = await readFile(node.path);
      openFile(node.path, content);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const refreshFileTree = async () => {
    const tree = await buildFileTree();
    setFileTree(tree);
  };

  const handleCreateFile = async () => {
    if (!newItemName.trim()) return;

    const newPath = getSiblingOrChildPath(node, newItemName);

    try {
      await createFile(newPath, '');
      await refreshFileTree();
      await syncSession(sessionId, setSessionStatus);
      setShowNewFileDialog(false);
      setNewItemName('');
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newItemName.trim()) return;

    const newPath = getSiblingOrChildPath(node, newItemName);

    try {
      await createDirectory(newPath);
      await refreshFileTree();
      await syncSession(sessionId, setSessionStatus);
      setShowNewFolderDialog(false);
      setNewItemName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${node.name}?`)) return;

    try {
      await deleteFile(node.path);
      await refreshFileTree();
      await syncSession(sessionId, setSessionStatus);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const isActive = activeFile === node.path;

  return (
    <div>
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div
            className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700 ${
              isActive ? 'bg-blue-600' : ''
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={handleClick}
          >
            {node.type === 'directory' ? (
              <>
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen size={16} className="text-blue-400 flex-shrink-0" />
                ) : (
                  <Folder size={16} className="text-blue-400 flex-shrink-0" />
                )}
              </>
            ) : (
              <>
                <span className="w-4 flex-shrink-0" />
                <File size={16} className="text-gray-400 flex-shrink-0" />
              </>
            )}
            <span className="text-sm text-gray-200 truncate">{node.name}</span>
          </div>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Content className="min-w-[180px] bg-gray-800 rounded-md overflow-hidden p-1 shadow-lg border border-gray-700">
            <ContextMenu.Item
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-200 cursor-pointer hover:bg-gray-700 rounded outline-none"
              onClick={() => setShowNewFileDialog(true)}
            >
              <FilePlus size={16} />
              New File
            </ContextMenu.Item>
            <ContextMenu.Item
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-200 cursor-pointer hover:bg-gray-700 rounded outline-none"
              onClick={() => setShowNewFolderDialog(true)}
            >
              <FolderPlus size={16} />
              New Folder
            </ContextMenu.Item>
            <ContextMenu.Separator className="h-[1px] bg-gray-700 my-1" />
            <ContextMenu.Item
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-400 cursor-pointer hover:bg-gray-700 rounded outline-none"
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>

      <Dialog.Root open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-white mb-4">
              New File
            </Dialog.Title>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              placeholder="filename.txt"
              className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewFileDialog(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-white mb-4">
              New Folder
            </Dialog.Title>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder="folder-name"
              className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewFolderDialog(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC = () => {
  const { fileTree, sessionId, setFileTree, setSessionStatus } = useStore();
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const refreshFileTree = async () => {
    const tree = await buildFileTree();
    setFileTree(tree);
  };

  const handleCreateFile = async () => {
    if (!newItemName.trim()) return;

    try {
      await createFile(newItemName, '');
      await refreshFileTree();
      await syncSession(sessionId, setSessionStatus);
      setShowNewFileDialog(false);
      setNewItemName('');
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newItemName.trim()) return;

    try {
      await createDirectory(newItemName);
      await refreshFileTree();
      await syncSession(sessionId, setSessionStatus);
      setShowNewFolderDialog(false);
      setNewItemName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  return (
    <div className="h-full bg-gray-800 overflow-auto">
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div className="h-full">
            <div className="p-2 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">FILES</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowNewFileDialog(true)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="New File"
                >
                  <FilePlus size={16} className="text-gray-400" />
                </button>
                <button
                  onClick={() => setShowNewFolderDialog(true)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="New Folder"
                >
                  <FolderPlus size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
            <div className="py-1">
              {fileTree.map((node) => (
                <FileTreeItem key={node.path} node={node} level={0} />
              ))}
            </div>
          </div>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Content className="min-w-[180px] bg-gray-800 rounded-md overflow-hidden p-1 shadow-lg border border-gray-700">
            <ContextMenu.Item
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-200 cursor-pointer hover:bg-gray-700 rounded outline-none"
              onClick={() => setShowNewFileDialog(true)}
            >
              <FilePlus size={16} />
              New File
            </ContextMenu.Item>
            <ContextMenu.Item
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-200 cursor-pointer hover:bg-gray-700 rounded outline-none"
              onClick={() => setShowNewFolderDialog(true)}
            >
              <FolderPlus size={16} />
              New Folder
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>

      <Dialog.Root open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-white mb-4">
              New File
            </Dialog.Title>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              placeholder="filename.txt"
              className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewFileDialog(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-white mb-4">
              New Folder
            </Dialog.Title>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder="folder-name"
              className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewFolderDialog(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
