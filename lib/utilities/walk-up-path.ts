import * as path from 'path';

const regex: RegExp = /^[./]$/;

function walkUp(thePath: string): string[] {
  let paths: string[] = [];

  let currentPath: string = thePath;

  while (true) {
    currentPath = path.dirname(currentPath);
    if (regex.test(currentPath)) {
      break;
    }
    paths.push(currentPath);
  }

  return paths;
}

export default walkUp;
