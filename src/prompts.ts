



// src/prompts.ts
import inquirer from 'inquirer';
import { getTemplates } from './utils/file';
import type { PackageManager } from './types';

export const promptProjectName = async (): Promise<string> => {
    const { projectName } = await inquirer.prompt([{
        type: 'input',
        name: 'projectName',
        message: 'Ingrese el nombre del proyecto:',
        validate: (input: string) => {
            if (!input.trim()) {
                return 'El nombre del proyecto es requerido';
            }
            return true;
        }
    }]);
    return projectName;
};

export const promptTemplate = async (): Promise<string> => {
    const templates = await getTemplates();
    const { template } = await inquirer.prompt([{
        type: 'list',
        name: 'template',
        message: 'Seleccione un template:',
        choices: templates
    }]);
    return template;
};

export const promptPackageManager = async (): Promise<PackageManager> => {
    const { packageManager } = await inquirer.prompt([{
        type: 'list',
        name: 'packageManager',
        message: '¿Qué manejador de paquetes desea usar?',
        choices: ['npm', 'yarn', 'pnpm', 'bun']
    }]);
    return packageManager;
};

export const promptInstallDependencies = async (): Promise<boolean> => {
    const { install } = await inquirer.prompt([{
        type: 'confirm',
        name: 'install',
        message: '¿Desea instalar las dependencias?',
        default: true
    }]);
    return install;
};

export const promptGitInit = async (): Promise<boolean> => {
    const { init } = await inquirer.prompt([{
        type: 'confirm',
        name: 'init',
        message: '¿Desea inicializar un repositorio Git?',
        default: true
    }]);
    return init;
};