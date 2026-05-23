import { getWebContainer } from './webcontainer';
import { writeToTerminal } from './terminalManager';

export async function createFile(path: string, content = ''): Promise<void> {
  try {
    const container = await getWebContainer();
    await container.fs.writeFile(path, content);
    writeToTerminal(`\r\n✅ Created file: ${path}\r\n`);
  } catch (error) {
    writeToTerminal(`\r\n❌ Failed to create file: ${error}\r\n`);
    throw error;
  }
}

export async function createDirectory(path: string): Promise<void> {
  try {
    const container = await getWebContainer();
    await container.fs.mkdir(path, { recursive: true });
    writeToTerminal(`\r\n✅ Created directory: ${path}\r\n`);
  } catch (error) {
    writeToTerminal(`\r\n❌ Failed to create directory: ${error}\r\n`);
    throw error;
  }
}

export async function deleteFile(path: string): Promise<void> {
  try {
    const container = await getWebContainer();
    await container.fs.rm(path, { recursive: true });
    writeToTerminal(`\r\n✅ Deleted: ${path}\r\n`);
  } catch (error) {
    writeToTerminal(`\r\n❌ Failed to delete: ${error}\r\n`);
    throw error;
  }
}

export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  try {
    const container = await getWebContainer();
    
    // WebContainer 没有直接的 rename，需要读取后写入再删除
    const content = await container.fs.readFile(oldPath, 'utf-8');
    await container.fs.writeFile(newPath, content);
    await container.fs.rm(oldPath);
    
    writeToTerminal(`\r\n✅ Renamed: ${oldPath} → ${newPath}\r\n`);
  } catch (error) {
    writeToTerminal(`\r\n❌ Failed to rename: ${error}\r\n`);
    throw error;
  }
}
