import { getWebContainer } from './webcontainer';
import { FileTreeNode } from '../store/useStore';

export async function buildFileTree(path = '.'): Promise<FileTreeNode[]> {
  const container = await getWebContainer();
  
  try {
    const entries = await container.fs.readdir(path, { withFileTypes: true });
    const nodes: FileTreeNode[] = [];

    for (const entry of entries) {
      const fullPath = path === '.' ? entry.name : `${path}/${entry.name}`;

      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath);
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children,
        });
      } else {
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
        });
      }
    }

    return nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });
  } catch (error) {
    console.error('Error building file tree:', error);
    return [];
  }
}

export async function watchFileSystem(
  onUpdate: (tree: FileTreeNode[]) => void,
  intervalMs = 2000
): Promise<() => void> {
  let isWatching = true;

  const watch = async () => {
    while (isWatching) {
      try {
        const tree = await buildFileTree();
        onUpdate(tree);
      } catch (error) {
        console.error('Error watching file system:', error);
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  };

  watch();

  return () => {
    isWatching = false;
  };
}
