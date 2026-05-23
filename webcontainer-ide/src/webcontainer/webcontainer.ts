import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainer.boot();
  }
  return webcontainerInstance;
}

export async function writeFile(path: string, content: string): Promise<void> {
  const container = await getWebContainer();
  await container.fs.writeFile(path, content);
}

export async function readFile(path: string): Promise<string> {
  const container = await getWebContainer();
  const data = await container.fs.readFile(path, 'utf-8');
  return data;
}

export async function mkdir(path: string): Promise<void> {
  const container = await getWebContainer();
  await container.fs.mkdir(path, { recursive: true });
}

export async function rm(path: string): Promise<void> {
  const container = await getWebContainer();
  await container.fs.rm(path, { recursive: true });
}

export async function readdir(path: string): Promise<string[]> {
  const container = await getWebContainer();
  return await container.fs.readdir(path);
}

export async function runCommand(
  command: string,
  args: string[],
  onOutput?: (output: string) => void
): Promise<number> {
  const container = await getWebContainer();
  const process = await container.spawn(command, args);

  if (onOutput) {
    process.output.pipeTo(
      new WritableStream({
        write(data) {
          onOutput(data);
        },
      })
    );
  }

  return await process.exit;
}
