// src/types.ts
export interface CliOptions {
    template: string;
    yes: boolean;
    name: string;
    projectName?: string;
    packageManager?: PackageManager;
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';
