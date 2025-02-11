import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { execSync } from 'child_process';
import inquirer from 'inquirer';

const program = new Command();

program
  .name('create-project')
  .description('CLI para crear un template de proyecto base')
  .version('1.0.0')
  .argument('[project-name]', 'Nombre del proyecto')
  .action(async (projectName?: string) => {
    if (!projectName) {
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Introduce el nombre del proyecto:',
          validate: input => input ? true : 'El nombre del proyecto no puede estar vacío.'
        }
      ]);
      projectName = response.projectName;
    }
    
    const projectPath = path.join(process.cwd(), projectName!);
    
    if (fs.existsSync(projectPath)) {
      console.error(`El directorio ${projectName} ya existe.`);
      process.exit(1);
    }

    const spinner = ora('Creando proyecto...').start();
    fs.mkdirSync(projectPath);

    try {
      const folders = ['src', 'tests'];
      folders.forEach(folder => fs.mkdirSync(path.join(projectPath, folder)));
      
      fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify({
        name: projectName,
        version: '1.0.0',
        scripts: {
          start: 'node dist/index.js',
          build: 'tsc'
        }
      }, null, 2));
      
      fs.writeFileSync(path.join(projectPath, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
          target: 'ES6',
          module: 'CommonJS',
          outDir: 'dist',
          rootDir: 'src'
        }
      }, null, 2));
      
      fs.writeFileSync(path.join(projectPath, 'src', 'index.ts'), `console.log('Hello, world!');`);
      
      spinner.succeed('Proyecto creado con éxito.');

      const { packageManager } = await inquirer.prompt<{ packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' }>([
        {
          type: 'list',
          name: 'packageManager',
          message: 'Selecciona el manejador de paquetes:',
          choices: ['npm', 'yarn', 'pnpm', 'bun']
        }
      ]);

      const { installDependencies } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'installDependencies',
          message: '¿Deseas instalar las dependencias?',
          default: true
        }
      ]);

      if (installDependencies) {
        const installSpinner = ora(`Instalando dependencias con ${packageManager}...`).start();
        try {
          const installCommand = {
            npm: 'npm install',
            yarn: 'yarn install',
            pnpm: 'pnpm install',
            bun: 'bun install'
          }[packageManager];
          execSync(installCommand, { cwd: projectPath, stdio: 'inherit' });
          installSpinner.succeed('Dependencias instaladas con éxito.');
        } catch (error) {
          installSpinner.fail('Error al instalar dependencias.');
        }
      }

      const { initGit } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'initGit',
          message: '¿Deseas inicializar un repositorio Git?',
          default: true
        }
      ]);

      if (initGit) {
        const gitSpinner = ora('Inicializando repositorio Git...').start();
        try {
          execSync('git init', { cwd: projectPath, stdio: 'inherit' });
          fs.writeFileSync(path.join(projectPath, '.gitignore'), 'node_modules\ndist\n');
          gitSpinner.succeed('Repositorio Git inicializado con éxito.');
        } catch (error) {
          gitSpinner.fail('Error al inicializar el repositorio Git.');
        }
      }
    } catch (error) {
      spinner.fail('Error al crear el proyecto.');
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
