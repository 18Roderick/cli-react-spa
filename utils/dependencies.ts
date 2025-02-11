// src/utils/dependencies.ts
import { execSync } from 'child_process';
import type { PackageManager } from '../types';

export const installDependencies = (
    projectPath: string,
    packageManager: PackageManager
): void => {
    const commands: Record<PackageManager, string> = {
        npm: 'npm install',
        yarn: 'yarn',
        pnpm: 'pnpm install',
        bun: 'bun install'
    };

    execSync(commands[packageManager], { 
        cwd: projectPath,
        stdio: 'inherit'
    });
};