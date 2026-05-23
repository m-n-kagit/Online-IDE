import { getWebContainer } from './webcontainer';
import { defaultTemplate, FileSystemTree } from './template';
import { useStore } from '../store/useStore';
import { writeToTerminal } from './terminalManager';
import { buildFileTree, watchFileSystem } from './fileWatcher';
import { initializeSession } from '../session/sessionApi';
import type { SessionEntry } from '../session/sessionApi';
import { buildFileSystemTreeFromSession } from './sessionPersistence';

async function mountFiles(tree: FileSystemTree): Promise<void> {
  const container = await getWebContainer();
  await container.mount(tree as any);
}

async function checkDependenciesInstalled(): Promise<boolean> {
  try {
    const container = await getWebContainer();
    const entries = await container.fs.readdir('.');
    return entries.includes('node_modules');
  } catch {
    return false;
  }
}

export async function initializeWebContainer(): Promise<void> {
  const {
    setBooting,
    setInstalling,
    setRunning,
    setFileTree,
    setPreviewUrl,
    setSessionId,
    setSessionStatus,
  } = useStore.getState();

  try {
    setSessionStatus('restoring');

    setBooting(true);
    writeToTerminal('Booting WebContainer...\r\n');
    const container = await getWebContainer();
    writeToTerminal('WebContainer booted successfully\r\n');
    setBooting(false);

    writeToTerminal('Mounting file system...\r\n');
    let savedEntries: SessionEntry[] = [];

    try {
      const sessionData = await initializeSession();
      setSessionId(sessionData.session.sessionId);
      savedEntries = sessionData.files;
    } catch (error) {
      console.error('Failed to restore session:', error);
      setSessionStatus('error');
      writeToTerminal('Session restore failed, loading default template\r\n');
    }

    const initialTree: FileSystemTree =
      savedEntries.length > 0
        ? buildFileSystemTreeFromSession(savedEntries)
        : defaultTemplate;

    await mountFiles(initialTree);
    writeToTerminal('File system mounted\r\n');
    setSessionStatus('saved');

    const tree = await buildFileTree();
    setFileTree(tree);

    const depsInstalled = await checkDependenciesInstalled();

    if (depsInstalled) {
      writeToTerminal('\r\nDependencies already installed (using cache)\r\n');
    } else {
      setInstalling(true);
      writeToTerminal('\r\nInstalling dependencies with pnpm...\r\n');

      const installProcess = await container.spawn('pnpm', ['install']);

      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            writeToTerminal(data);
          },
        })
      );

      const installExitCode = await installProcess.exit;

      if (installExitCode !== 0) {
        throw new Error('pnpm install failed');
      }

      writeToTerminal('Dependencies installed successfully\r\n');
      setInstalling(false);
    }

    setRunning(true);
    writeToTerminal('\r\nStarting dev server...\r\n');

    const devProcess = await container.spawn('pnpm', ['run', 'dev']);

    devProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          writeToTerminal(data);
        },
      })
    );

    container.on('server-ready', (_port, url) => {
      writeToTerminal('\r\nDev server ready\r\n');
      writeToTerminal(`Preview: ${url}\r\n`);
      setPreviewUrl(url);
    });

    watchFileSystem((nextTree) => {
      setFileTree(nextTree);
    }, 2000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    writeToTerminal(`\r\nError: ${errorMessage}\r\n`);
    setBooting(false);
    setInstalling(false);
    setRunning(false);
    setSessionStatus('error');
  }
}
