import fs from 'fs';
import path from 'path';
import CodeWorkspace from '../models/CodeWorkspace';

const WORKSPACE_BASE_DIR = path.resolve(__dirname, '../../data/workspaces');

export interface FileTreeItem {
  id: string; // Relative path, e.g. "src/index.ts"
  name: string; // e.g. "index.ts"
  path: string; // Relative path, e.g. "src/index.ts"
  type: 'file' | 'folder';
  size?: number;
  extension?: string;
  modifiedAt?: Date;
  children?: FileTreeItem[];
}

export interface SearchResultItem {
  file: string;
  line: number;
  column: number;
  preview: string;
  match: string;
}

// Ignore list for file tree & search
const IGNORED_PATHS = new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  '.DS_Store',
  'Thumbs.db',
  '.vscode',
]);

export class WorkspaceService {
  /**
   * Resolves the absolute path to the workspace root for a given project.
   */
  public static getWorkspaceRoot(projectId: string): string {
    const root = path.join(WORKSPACE_BASE_DIR, projectId);
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    return root;
  }

  /**
   * Validates and resolves a relative path within the workspace root.
   * Prevents directory traversal attacks (e.g. "../../../etc/passwd").
   */
  public static resolveSafePath(projectId: string, relativePath: string = ''): string {
    const root = this.getWorkspaceRoot(projectId);
    const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolute = path.resolve(root, normalized);

    if (!absolute.startsWith(root)) {
      throw new Error('Access denied: Path traversal outside workspace root');
    }
    return absolute;
  }

  /**
   * Initializes workspace metadata and ensures default starter files exist if directory is empty.
   */
  public static async initWorkspace(projectId: string): Promise<any> {
    const root = this.getWorkspaceRoot(projectId);
    let workspace = await CodeWorkspace.findOne({ project: projectId });

    if (!workspace) {
      workspace = await CodeWorkspace.create({
        project: projectId,
        rootPath: projectId,
        currentBranch: 'main',
        defaultBranch: 'main',
        settings: {
          tabSize: 2,
          fontSize: 13,
          minimap: true,
          wordWrap: 'on',
          formatOnSave: true,
          theme: 'vs-dark',
        },
      });
    }

    // If directory is empty, seed with a clean, starter project template
    const entries = fs.readdirSync(root);
    if (entries.length === 0) {
      this.seedStarterTemplate(root);
    }

    return workspace;
  }

  /**
   * Seeds starter files for an empty project workspace.
   */
  private static seedStarterTemplate(root: string) {
    const readmeContent = `# SprintForge Project Workspace

Welcome to your collaborative development workspace!

## Features
- **Real-Time Collaboration**: Edit files concurrently with your team members.
- **Git & GitHub Integration**: Commit, push, pull, and branch seamlessly.
- **Terminal**: Run dev commands in an isolated environment.
- **Monaco Editor**: High performance editing with syntax highlighting and diff viewer.

Happy coding! 🚀
`;
    fs.writeFileSync(path.join(root, 'README.md'), readmeContent, 'utf-8');

    const srcDir = path.join(root, 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    const indexContent = `// SprintForge Application Entry Point
console.log("Welcome to SprintForge Collaborative Workspace!");

export function calculateVelocity(sprintPoints = []) {
  if (!sprintPoints.length) return 0;
  const total = sprintPoints.reduce((acc, curr) => acc + curr, 0);
  return Math.round(total / sprintPoints.length);
}

export function main() {
  const points = [18, 24, 21, 28];
  const velocity = calculateVelocity(points);
  console.log(\`Team sprint velocity: \${velocity} pts/sprint\`);
}

main();
`;
    fs.writeFileSync(path.join(srcDir, 'index.ts'), indexContent, 'utf-8');

    const pkgContent = `{
  "name": "sprintforge-project",
  "version": "1.0.0",
  "description": "SprintForge collaborative workspace project",
  "main": "src/index.ts",
  "scripts": {
    "start": "node src/index.ts",
    "test": "echo \\"Running tests... All tests passed!\\""
  }
}
`;
    fs.writeFileSync(path.join(root, 'package.json'), pkgContent, 'utf-8');
  }

  /**
   * Recursively reads the workspace directory and builds a nested FileTreeItem structure.
   */
  public static async getFileTree(projectId: string): Promise<FileTreeItem[]> {
    const root = this.getWorkspaceRoot(projectId);

    const scanDir = (dirPath: string, relativeDir: string = ''): FileTreeItem[] => {
      const results: FileTreeItem[] = [];
      if (!fs.existsSync(dirPath)) return results;

      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      // Sort: folders first, then files alphabetically
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      for (const entry of entries) {
        if (IGNORED_PATHS.has(entry.name)) continue;

        const fullPath = path.join(dirPath, entry.name);
        const relPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
        const normalizedRelPath = relPath.replace(/\\/g, '/');

        if (entry.isDirectory()) {
          const children = scanDir(fullPath, relPath);
          results.push({
            id: normalizedRelPath,
            name: entry.name,
            path: normalizedRelPath,
            type: 'folder',
            children,
          });
        } else {
          let stat: fs.Stats | undefined;
          try {
            stat = fs.statSync(fullPath);
          } catch {}

          const ext = path.extname(entry.name).replace(/^\./, '');
          results.push({
            id: normalizedRelPath,
            name: entry.name,
            path: normalizedRelPath,
            type: 'file',
            size: stat?.size || 0,
            extension: ext,
            modifiedAt: stat?.mtime,
          });
        }
      }
      return results;
    };

    return scanDir(root);
  }

  /**
   * Reads the text content of a file within the workspace.
   */
  public static async readFile(
    projectId: string,
    filePath: string
  ): Promise<{ content: string; path: string; size: number; modifiedAt: Date }> {
    const absPath = this.resolveSafePath(projectId, filePath);

    if (!fs.existsSync(absPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      throw new Error(`Path is a directory, not a file: ${filePath}`);
    }

    // Limit single file read size to 10MB to prevent memory exhaustion
    if (stat.size > 10 * 1024 * 1024) {
      throw new Error('File exceeds maximum readable size limit (10MB)');
    }

    const content = fs.readFileSync(absPath, 'utf-8');
    return {
      content,
      path: filePath.replace(/\\/g, '/'),
      size: stat.size,
      modifiedAt: stat.mtime,
    };
  }

  /**
   * Writes content to a file, creating parent directories if necessary.
   */
  public static async writeFile(
    projectId: string,
    filePath: string,
    content: string
  ): Promise<{ success: boolean; path: string; size: number }> {
    const absPath = this.resolveSafePath(projectId, filePath);
    const parentDir = path.dirname(absPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(absPath, content, 'utf-8');
    const stat = fs.statSync(absPath);

    return {
      success: true,
      path: filePath.replace(/\\/g, '/'),
      size: stat.size,
    };
  }

  /**
   * Creates a new empty file.
   */
  public static async createFile(projectId: string, filePath: string): Promise<boolean> {
    const absPath = this.resolveSafePath(projectId, filePath);
    if (fs.existsSync(absPath)) {
      throw new Error(`File already exists: ${filePath}`);
    }

    const parentDir = path.dirname(absPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(absPath, '', 'utf-8');
    return true;
  }

  /**
   * Creates a new directory.
   */
  public static async createFolder(projectId: string, folderPath: string): Promise<boolean> {
    const absPath = this.resolveSafePath(projectId, folderPath);
    if (fs.existsSync(absPath)) {
      throw new Error(`Directory already exists: ${folderPath}`);
    }

    fs.mkdirSync(absPath, { recursive: true });
    return true;
  }

  /**
   * Renames a file or directory.
   */
  public static async renamePath(
    projectId: string,
    oldPath: string,
    newPath: string
  ): Promise<boolean> {
    const oldAbs = this.resolveSafePath(projectId, oldPath);
    const newAbs = this.resolveSafePath(projectId, newPath);

    if (!fs.existsSync(oldAbs)) {
      throw new Error(`Source path not found: ${oldPath}`);
    }
    if (fs.existsSync(newAbs)) {
      throw new Error(`Destination path already exists: ${newPath}`);
    }

    const newParent = path.dirname(newAbs);
    if (!fs.existsSync(newParent)) {
      fs.mkdirSync(newParent, { recursive: true });
    }

    fs.renameSync(oldAbs, newAbs);
    return true;
  }

  /**
   * Deletes a file or directory.
   */
  public static async deletePath(projectId: string, targetPath: string): Promise<boolean> {
    const absPath = this.resolveSafePath(projectId, targetPath);
    const root = this.getWorkspaceRoot(projectId);

    if (absPath === root) {
      throw new Error('Cannot delete the root workspace directory');
    }

    if (!fs.existsSync(absPath)) {
      throw new Error(`Path not found: ${targetPath}`);
    }

    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      fs.rmSync(absPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(absPath);
    }
    return true;
  }

  /**
   * Duplicates a file.
   */
  public static async duplicateFile(
    projectId: string,
    sourcePath: string,
    destPath?: string
  ): Promise<string> {
    const srcAbs = this.resolveSafePath(projectId, sourcePath);
    if (!fs.existsSync(srcAbs)) {
      throw new Error(`Source file not found: ${sourcePath}`);
    }

    let finalDest = destPath;
    if (!finalDest) {
      const ext = path.extname(sourcePath);
      const base = sourcePath.slice(0, sourcePath.length - ext.length);
      finalDest = `${base}_copy${ext}`;
      let counter = 1;
      while (fs.existsSync(this.resolveSafePath(projectId, finalDest))) {
        counter++;
        finalDest = `${base}_copy${counter}${ext}`;
      }
    }

    const destAbs = this.resolveSafePath(projectId, finalDest);
    fs.copyFileSync(srcAbs, destAbs);
    return finalDest.replace(/\\/g, '/');
  }

  /**
   * Project-wide text search across all workspace files.
   */
  public static async searchWorkspace(
    projectId: string,
    query: string,
    caseSensitive: boolean = false,
    isRegex: boolean = false
  ): Promise<SearchResultItem[]> {
    if (!query || query.trim().length === 0) return [];

    const root = this.getWorkspaceRoot(projectId);
    const results: SearchResultItem[] = [];
    const MAX_RESULTS = 100;

    let searchRegex: RegExp;
    try {
      if (isRegex) {
        searchRegex = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchRegex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
      }
    } catch {
      throw new Error('Invalid regular expression in search query');
    }

    const scanFilesForSearch = (dirPath: string, relDir: string = '') => {
      if (results.length >= MAX_RESULTS) return;
      if (!fs.existsSync(dirPath)) return;

      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (results.length >= MAX_RESULTS) break;
        if (IGNORED_PATHS.has(entry.name)) continue;

        const fullPath = path.join(dirPath, entry.name);
        const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
        const normalizedRel = relPath.replace(/\\/g, '/');

        if (entry.isDirectory()) {
          scanFilesForSearch(fullPath, relPath);
        } else {
          // Avoid binary files or massive files
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size > 2 * 1024 * 1024) continue; // Skip files > 2MB

            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              searchRegex.lastIndex = 0;
              let match: RegExpExecArray | null;

              while ((match = searchRegex.exec(line)) !== null) {
                results.push({
                  file: normalizedRel,
                  line: i + 1,
                  column: match.index + 1,
                  preview: line.trim(),
                  match: match[0],
                });
                if (results.length >= MAX_RESULTS) break;
              }
              if (results.length >= MAX_RESULTS) break;
            }
          } catch {
            // Ignore unreadable / binary files
          }
        }
      }
    };

    scanFilesForSearch(root);
    return results;
  }
}
