import { useEffect } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import { FileTree } from './ui/FileTree';
import { Editor } from './editor/Editor';
import { Preview } from './preview/Preview';
import { Terminal } from './ui/Terminal';
import { initializeWebContainer } from './webcontainer/init';
import { useStore } from './store/useStore';
import { Loader2 } from 'lucide-react';

function App() {
  const { isBooting, isInstalling, sessionId, sessionStatus } = useStore();

  const sessionLabel =
    sessionStatus === 'restoring'
      ? 'Restoring session'
      : sessionStatus === 'saving'
        ? 'Saving session'
        : sessionStatus === 'error'
          ? 'Session error'
          : 'Session saved';

  useEffect(() => {
    initializeWebContainer();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4">
        <h1 className="text-lg font-bold">ONLINE IDE</h1>
        {(isBooting || isInstalling) && (
          <div className="ml-4 flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            <span>{isBooting ? 'Booting...' : 'Installing dependencies...'}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="rounded-full border border-gray-600 px-3 py-1 text-gray-300">
            {sessionLabel}
          </span>
          {sessionId && <span className="font-mono text-gray-400">{sessionId.slice(0, 8)}</span>}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left: File Tree */}
          <Panel defaultSize={15} minSize={10} maxSize={30}>
            <div className="h-full border-r border-gray-700 overflow-hidden">
              <FileTree />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />

          {/* Middle: Editor + Terminal */}
          <Panel defaultSize={50} minSize={30}>
            <PanelGroup direction="vertical">
              {/* Editor */}
              <Panel defaultSize={70} minSize={30}>
                <div className="h-full overflow-hidden">
                  <Editor />
                </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-blue-500 transition-colors" />

              {/* Terminal */}
              <Panel defaultSize={30} minSize={15}>
                <div className="h-full overflow-hidden">
                  <Terminal />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />

          {/* Right: Preview */}
          <Panel defaultSize={35} minSize={20}>
            <div className="h-full border-l border-gray-700 overflow-hidden">
              <Preview />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default App;
