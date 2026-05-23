import React, { useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { writeFile } from '../webcontainer/webcontainer';
import { persistSessionSnapshot } from '../webcontainer/sessionPersistence';

export const Editor: React.FC = () => {
  const {
    openFiles,
    activeFile,
    fileContents,
    sessionId,
    closeFile,
    setActiveFile,
    setSessionStatus,
    updateFileContent,
  } = useStore();

  const editorRef = useRef<any>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    
    updateFileContent(activeFile, value);

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        setSessionStatus('saving');
        await writeFile(activeFile, value);

        if (sessionId) {
          await persistSessionSnapshot(sessionId);
        }

        setSessionStatus('saved');
      } catch (error) {
        console.error('Failed to write file:', error);
        setSessionStatus('error');
      }
    }, 500);
  };

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
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
    return languageMap[ext || ''] || 'plaintext';
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Tabs */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {openFiles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 py-8">
            <p>No file open. Select a file from the file tree.</p>
          </div>
        ) : (
          openFiles.map((file) => (
            <div
              key={file}
              className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer ${
                activeFile === file ? 'bg-gray-900 text-white' : 'bg-gray-800 text-gray-400'
              }`}
              onClick={() => setActiveFile(file)}
            >
              <span className="text-sm whitespace-nowrap">{file.split('/').pop()}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file);
                }}
                className="hover:bg-gray-700 rounded p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Editor */}
      <div className="flex-1">
        {activeFile && (
          <MonacoEditor
            height="100%"
            language={getLanguage(activeFile)}
            value={fileContents[activeFile] || ''}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              automaticLayout: true,
              tabSize: 2,
            }}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        )}
      </div>
    </div>
  );
};
