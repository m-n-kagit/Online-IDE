import { getWebContainer } from './webcontainer';
import { FileSystemTree } from './template';
import { saveSessionEntries } from '../session/sessionApi';
import type { SessionEntry } from '../session/sessionApi';

const IGNORED_PATHS = new Set(['node_modules', 'dist', '.git']);

function inferLanguage(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    md: 'markdown',
  };

  return languageMap[extension || ''] || 'plaintext';
}

async function exportDirectory(path = '.'): Promise<SessionEntry[]> {
  const container = await getWebContainer();
  const entries = await container.fs.readdir(path, { withFileTypes: true });
  const files: SessionEntry[] = [];

  for (const entry of entries) {
    if (IGNORED_PATHS.has(entry.name)) {
      continue;
    }

    const fullPath = path === '.' ? entry.name : `${path}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push({
        name: entry.name,
        path: fullPath,
        type: 'directory',
      });
      files.push(...(await exportDirectory(fullPath)));
      continue;
    }

    const content = await container.fs.readFile(fullPath, 'utf-8');
    files.push({
      name: entry.name,
      path: fullPath,
      type: 'file',
      content,
      language: inferLanguage(fullPath),
    });
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function persistSessionSnapshot(sessionId: string): Promise<void> {
  const files = await exportDirectory();
  await saveSessionEntries(sessionId, files);
}

export function buildFileSystemTreeFromSession(entries: SessionEntry[]): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const entry of entries) {
    const parts = entry.path.split('/').filter(Boolean);
    let currentLevel = tree;

    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      const isLeaf = index === parts.length - 1;

      if (isLeaf) {
        if (entry.type === 'directory') {
          currentLevel[part] = currentLevel[part] || { directory: {} };
        } else {
          currentLevel[part] = {
            file: {
              contents: entry.content || '',
            },
          };
        }
        continue;
      }

      currentLevel[part] = currentLevel[part] || { directory: {} };
      currentLevel[part].directory = currentLevel[part].directory || {};
      currentLevel = currentLevel[part].directory!;
    }
  }

  return tree;
}
