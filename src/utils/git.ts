
// src/utils/git.ts
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

export const initGitRepo = async (projectPath: string): Promise<void> => {
    try {
        execSync('git init', { cwd: projectPath });
        const gitignoreContent = 'node_modules\ndist\n';
        await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);
    } catch (error) {
        throw new Error('Error al inicializar el repositorio Git');
    }
};