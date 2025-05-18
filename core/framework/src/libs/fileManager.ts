import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export function createFileManager(baseDir: string) {
  async function ensureDir() {
    try {
      await fs.mkdir(baseDir, { recursive: true });
    } catch {}
  }

  async function addFile(filename: string, content: string) {
    await ensureDir();
    await fs.writeFile(join(baseDir, filename), content, 'utf8');
  }

  async function deleteFile(filename: string) {
    await fs.unlink(join(baseDir, filename));
  }

  async function listFiles() {
    await ensureDir();
    return fs.readdir(baseDir);
  }

  async function readFile(filename: string) {
    return fs.readFile(join(baseDir, filename), 'utf8');
  }

  async function writeFile(filename: string, content: string) {
    await addFile(filename, content);
  }

  return {
    ensureDir,
    addFile,
    deleteFile,
    listFiles,
    readFile,
    writeFile,
  };
} 