// src/types.ts
export interface CliOptions {
    name: string;
    projectName?: string;
    packageManager?: PackageManager;
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';
