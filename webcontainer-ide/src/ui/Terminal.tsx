import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { Terminal as TerminalIcon, Trash2, ArrowDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getWebContainer } from '../webcontainer/webcontainer';
import { setTerminalInstance } from '../webcontainer/terminalManager';

export const Terminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { clearTerminal } = useStore();
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const xterm = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: '"Cascadia Code", Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#d4d4d4',
        cursor: '#00ff00',
        cursorAccent: '#000000',
        selectionBackground: '#3a3d41',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
      scrollback: 10000,
      convertEol: true,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);
    xterm.open(terminalRef.current);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // 注册全局实例
    setTerminalInstance(xterm);

    // 延迟 fit 确保容器尺寸正确
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn('Fit failed:', e);
        }
      });
    });

    // 监听滚动
    let scrollTimeout: ReturnType<typeof setTimeout>;
    xterm.onScroll(() => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        try {
          const buffer = xterm.buffer.active;
          if (buffer) {
            const isAtBottom =
              buffer.viewportY >= buffer.baseY + buffer.cursorY - xterm.rows;
            setShowScrollButton(!isAtBottom);
          }
        } catch (e) {
          // 忽略
        }
      }, 100);
    });

    // 初始化命令行
    setTimeout(() => {
      xterm.writeln('\x1b[1;36m╔═══════════════════════════════════════╗\x1b[0m');
      xterm.writeln('\x1b[1;36m║   WebContainer IDE Terminal          ║\x1b[0m');
      xterm.writeln('\x1b[1;36m╚═══════════════════════════════════════╝\x1b[0m');
      xterm.writeln('');

      let currentLine = '';
      let isProcessRunning = false;

      const writePrompt = () => {
        xterm.write('\x1b[1;32m➜\x1b[0m \x1b[1;36m~\x1b[0m ');
      };

      writePrompt();

      // 处理输入
      xterm.onData((data) => {
        if (isProcessRunning) return;

        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter
          const command = currentLine.trim();
          currentLine = '';

          xterm.write('\r\n');

          if (command) {
            // 记录命令开始位置
            const startLine = xterm.buffer.active.baseY + xterm.buffer.active.cursorY;

            // 立即滚动到命令位置
            requestAnimationFrame(() => {
              try {
                xterm.scrollToLine(Math.max(0, startLine - 1));
              } catch (e) {
                // 忽略
              }
            });

            isProcessRunning = true;

            // 异步执行命令
            (async () => {
              try {
                const container = await getWebContainer();
                const parts = command.split(' ');
                const cmd = parts[0];
                const args = parts.slice(1);

                const process = await container.spawn(cmd, args);

                process.output.pipeTo(
                  new WritableStream({
                    write(chunk) {
                      xterm.write(chunk);
                    },
                  })
                );

                await process.exit;
              } catch (error) {
                xterm.writeln(`\x1b[1;31m✖ Error: ${error}\x1b[0m`);
              } finally {
                isProcessRunning = false;
                writePrompt();
              }
            })();
          } else {
            writePrompt();
          }
        } else if (code === 127) {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            xterm.write('\b \b');
          }
        } else if (code === 3) {
          // Ctrl+C
          if (isProcessRunning) {
            xterm.write('^C\r\n');
            isProcessRunning = false;
            writePrompt();
          } else {
            xterm.write('^C\r\n');
            currentLine = '';
            writePrompt();
          }
        } else if (code >= 32 && code <= 126) {
          // 可打印字符
          currentLine += data;
          xterm.write(data);
        }
      });
    }, 100);

    // 响应式调整
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // 忽略
      }
    });

    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      xterm.dispose();
      xtermRef.current = null;
    };
  }, []);

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln('\x1b[1;32m✓ Terminal cleared\x1b[0m');
      xtermRef.current.write('\r\n\x1b[1;32m➜\x1b[0m \x1b[1;36m~\x1b[0m ');
    }
    clearTerminal();
  };

  const scrollToBottom = () => {
    if (xtermRef.current) {
      xtermRef.current.scrollToBottom();
      setShowScrollButton(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black relative">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-green-400" />
          <h3 className="text-sm font-semibold text-gray-300">TERMINAL</h3>
          <span className="text-xs text-gray-500">Buffer: 10k lines</span>
        </div>
        <button
          onClick={handleClear}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          title="Clear terminal"
        >
          <Trash2 size={14} className="text-gray-400 hover:text-gray-200" />
        </button>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden"
        style={{
          backgroundColor: '#0a0a0a',
          padding: '12px',
        }}
      />

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 right-6 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-110"
          title="Scroll to bottom"
        >
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  );
};
