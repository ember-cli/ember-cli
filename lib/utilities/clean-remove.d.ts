interface FileInfo {
    outputPath: string;
    displayPath: string;
    outputBasePath: string;
}
declare function cleanRemove(fileInfo: FileInfo): Promise<void>;
export default cleanRemove;
