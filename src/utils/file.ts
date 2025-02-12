// src/utils/file.ts
import fs from 'fs-extra';
import path from 'path';

export const getTemplates = async (): Promise<string[]> => {
    // Cambio: Usando path.resolve para obtener la ruta a src/templates
    const templatesDir = path.resolve(__dirname, '../templates');
    
    try {
        // Verificar si el directorio existe
        if (!await fs.pathExists(templatesDir)) {
            throw new Error(`El directorio 'templates' no existe en ${templatesDir}. Por favor, créalo y añade tus templates.`);
        }

        const templates = await fs.readdir(templatesDir);
        return templates.filter(template => 
            fs.statSync(path.join(templatesDir, template)).isDirectory()
        );
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Error al leer los templates disponibles');
    }
};

export const copyTemplate = async (
    templateName: string,
    targetDir: string
): Promise<void> => {
    // Cambio: Usando la misma lógica de ruta que getTemplates
    const templateDir = path.resolve(__dirname, '../templates', templateName);
    
    if (!await fs.pathExists(templateDir)) {
        throw new Error(`El template '${templateName}' no existe en ${templateDir}`);
    }
    
    await fs.copy(templateDir, targetDir);
};


export const updatePackageJson = async (projectPath: string, projectName: string): Promise<void> => {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        packageJson.name = projectName.toLowerCase().replace(/\s+/g, '-');
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }
};
