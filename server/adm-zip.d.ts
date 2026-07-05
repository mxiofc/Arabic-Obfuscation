declare module 'adm-zip' {
  class AdmZip {
    constructor(buffer?: Buffer | string);
    getEntries(): ZipEntry[];
    getEntry(name: string): ZipEntry | null;
    addFile(entryName: string, data: Buffer | string): void;
    extractAllTo(targetPath: string, overwrite?: boolean): void;
    toBuffer(): Buffer;
  }

  interface ZipEntry {
    entryName: string;
    isDirectory: boolean;
    getData(): Buffer;
  }

  export = AdmZip;
}
