import { Terminal } from 'xterm';

let terminalInstance: Terminal | null = null;

export function setTerminalInstance(terminal: Terminal) {
  terminalInstance = terminal;
}

export function getTerminalInstance(): Terminal | null {
  return terminalInstance;
}

export function writeToTerminal(data: string) {
  if (terminalInstance) {
    terminalInstance.write(data);
  }
}
