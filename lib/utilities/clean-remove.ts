import * as path from 'path';
import * as fs from 'fs-extra';
import walkUp from './walk-up-path.js'; 

interface FileInfo {
  outputPath: string;
  displayPath: string;
  outputBasePath: string;
}

async function cleanRemove(fileInfo: FileInfo): Promise<void> {
  try {
    await fs.stat(fileInfo.outputPath);
    await fs.remove(fileInfo.outputPath);
    
    let paths: string[] = walkUp(fileInfo.displayPath).map((thePath: string) => 
      path.join(fileInfo.outputBasePath, thePath)
    );

    for (let thePath of paths) {
      let childPaths = await fs.readdir(thePath);
      if (childPaths.length > 0) {
        return;
      }

      await fs.remove(thePath);
    }
  } catch (err: any) {
    // swallow error if file doesn't exist (ENOENT)
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

export default cleanRemove;