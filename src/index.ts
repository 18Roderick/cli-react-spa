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
import { copyTemplate, updatePackageJson } from './utils/file';
import { installDependencies } from './utils/dependencies';
import { initGitRepo } from './utils/git';
import type { CliOptions } from './types';
import chalk from 'chalk';

async function main() {
    console.log(chalk.cyan('\n🚀 Generador de Proyectos\n'));

    program
        .option('-n, --name <name>', 'nombre del proyecto')
        .option('-t, --template <template>', 'nombre del template')
        .option('-p, --package-manager <manager>', 'manejador de paquetes (npm, yarn, pnpm, bun)')
        .option('-y, --yes', 'usar configuración por defecto')
        .version('1.0.0')
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
        const template = options.template || await promptTemplate();

        // Crear directorio y copiar template
        const spinner = ora('Creando proyecto...').start();
        await fs.ensureDir(projectPath);
        await copyTemplate(template, projectPath);
        spinner.succeed('Proyecto creado exitosamente');

        // Inicializar Git (antes de la instalación de dependencias)
        const shouldInitGit = options.yes || await promptGitInit();
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

        // Actualizar package.json con el nombre del proyecto
        await updatePackageJson(projectPath, projectName);

        // Manejar dependencias
        const packageManager = options.packageManager || await promptPackageManager();
        const shouldInstall = options.yes || await promptInstallDependencies();
        
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

        // Mostrar resumen y próximos pasos
        console.log('\n', chalk.green('✨ Proyecto generado exitosamente!'));
        console.log('\n', chalk.yellow('📁 Resumen:'));
        console.log('   - Nombre del proyecto:', chalk.cyan(projectName));
        console.log('   - Template usado:', chalk.cyan(template));
        console.log('   - Package manager:', chalk.cyan(packageManager));
        console.log('   - Git inicializado:', chalk.cyan(shouldInitGit ? 'Sí' : 'No'));
        console.log('   - Dependencias instaladas:', chalk.cyan(shouldInstall ? 'Sí' : 'No'));

        console.log('\n', chalk.yellow('📝 Próximos pasos:'));
        console.log(chalk.white(`   cd ${projectName}`));
        if (!shouldInstall) {
            console.log(chalk.white(`   ${packageManager} install`));
        }
        console.log(chalk.white(`   ${packageManager} start`));

        if (shouldInitGit) {
            console.log('\n', chalk.yellow('🔧 Git configurado:'));
            console.log(chalk.white('   git add .'));
            console.log(chalk.white('   git commit -m "Initial commit"'));
        }

    } catch (error) {
        console.error(chalk.red('\n❌ Error:'), (error as Error).message);
        process.exit(1);
    }
}

main();