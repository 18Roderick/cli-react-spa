

// src/index.ts
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { program } from 'commander';
import {
    promptProjectName,
    promptTemplate,
    promptPackageManager,
    promptInstallDependencies,
    promptGitInit
} from './prompts';
import { copyTemplate } from './utils/file';
import { installDependencies } from './utils/dependencies';
import { initGitRepo } from './utils/git';
import type { CliOptions } from './types';

async function main() {
    program
        .option('-n, --name <name>', 'nombre del proyecto')
        .parse(process.argv);

    const options = program.opts<CliOptions>();
    
    try {
        // Obtener nombre del proyecto
        const projectName = options.name || await promptProjectName();
        const projectPath = path.join(process.cwd(), projectName);

        // Verificar si el directorio ya existe
        if (await fs.pathExists(projectPath)) {
            throw new Error(`El directorio ${projectName} ya existe`);
        }

        // Seleccionar template
        const template = await promptTemplate();

        // Crear directorio y copiar template
        const spinner = ora('Creando proyecto...').start();
        await fs.ensureDir(projectPath);
        await copyTemplate(template, projectPath);
        spinner.succeed('Proyecto creado exitosamente');

        // Manejar dependencias
        const packageManager = await promptPackageManager();
        const shouldInstall = await promptInstallDependencies();
        
        if (shouldInstall) {
            const installSpinner = ora('Instalando dependencias...').start();
            try {
                installDependencies(projectPath, packageManager);
                installSpinner.succeed('Dependencias instaladas exitosamente');
            } catch (error) {
                installSpinner.fail('Error al instalar dependencias');
                throw error;
            }
        }

        // Inicializar Git
        const shouldInitGit = await promptGitInit();
        if (shouldInitGit) {
            const gitSpinner = ora('Inicializando repositorio Git...').start();
            try {
                await initGitRepo(projectPath);
                gitSpinner.succeed('Repositorio Git inicializado exitosamente');
            } catch (error) {
                gitSpinner.fail('Error al inicializar repositorio Git');
                throw error;
            }
        }

        console.log('\n✨ Proyecto generado exitosamente!');
        console.log(`\nPara comenzar:`);
        console.log(`  cd ${projectName}`);
        if (!shouldInstall) {
            console.log(`  ${packageManager} install`);
        }
        console.log(`  ${packageManager} start\n`);

    } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
    }
}

main();