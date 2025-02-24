import { chromium, type Browser, type Page } from 'playwright';
import fs from 'fs/promises';

// Definición estricta de la interfaz para eventos de carreras
interface RaceEvent {
  title: string;
  date: string;
  link: string;
  imageUrl: string;
  registrationLinks: {
    type: string;
    url: string;
  }[];
}

// Configuración
const config = {
  url: 'https://carreraspanama.com/',
  selector: '#eventos2 > div > div > div > div > div.col-lg-4.col-md-6 > div',
  outputFile: 'carreras_panama_eventos.json'
};

async function scrapeRaceEvents(url: string): Promise<RaceEvent[]> {
  let browser: Browser | null = null;

  try {
    console.log('🚀 Iniciando el navegador...');
    browser = await chromium.launch({ headless: true });
    const page: Page = await browser.newPage();

    console.log(`🌐 Navegando a: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Esperamos a que los eventos se carguen completamente
    await page.waitForSelector(config.selector, { timeout: 10000 });

    const events: RaceEvent[] = await page.evaluate((selector) => {
      const eventElements = document.querySelectorAll(selector);
      const eventList: any[] = [];

      eventElements.forEach(event => {
        // Extracción de datos según el HTML de ejemplo
        const title = event.querySelector('h4')?.textContent?.trim() || 'Sin título';
        
        // Extraer fecha del formato "DD/MM/YYYY"
        const dateElement = event.querySelector('.news-meta li');
        const dateText = dateElement?.textContent?.trim() || '';
        const dateMatch = dateText.match(/\d{2}\/\d{2}\/\d{4}/);
        const date = dateMatch ? dateMatch[0] : 'Fecha no disponible';
        
        // Enlaces de registro
        const registrationLinks: { type: string; url: string }[] = [];
        const linkElements = event.querySelectorAll('.buy-ticket a.btn');
        
        linkElements.forEach(linkElement => {
          const linkText = linkElement.textContent?.trim() || '';
          const url = linkElement.getAttribute('href') || '#';
          registrationLinks.push({
            type: linkText,
            url: url
          });
        });
        
        // Imagen del evento
        const imageUrl = event.querySelector('.thumb img')?.getAttribute('src') || '';
        
        // Enlace principal del evento (si existe)
        const link = event.querySelector('h4 a')?.getAttribute('href') || 
                     event.querySelector('.thumb a')?.getAttribute('href') || '#';

        eventList.push({ 
          title, 
          date, 
          link,
          imageUrl,
          registrationLinks
        });
      });

      return eventList;
    }, config.selector);

    console.log(`✅ Se encontraron ${events.length} eventos.`);
    return events;
  } catch (error) {
    console.error('❌ Error al hacer scraping:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
      console.log('🧹 Navegador cerrado correctamente.');
    }
  }
}

// Función para guardar los eventos en un archivo JSON
async function saveEventsToFile(events: RaceEvent[], filePath: string): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(events, null, 2), 'utf-8');
    console.log(`💾 Datos guardados exitosamente en: ${filePath}`);
  } catch (error) {
    console.error('❌ Error al guardar los datos:', error);
  }
}

// Función principal
async function main(): Promise<void> {
  console.log('🏃 Iniciando scraping de eventos de carreras...');
  
  const events = await scrapeRaceEvents(config.url);

  if (events.length === 0) {
    console.log('⚠️ No se encontraron eventos.');
    return;
  }
  
  // Mostrar los primeros 2 eventos como muestra
  console.log('📋 Muestra de eventos encontrados:');
  console.log(JSON.stringify(events.slice(0, 2), null, 2));
  
  // Guardar todos los eventos en un archivo
  await saveEventsToFile(events, config.outputFile);
  
  console.log('✅ Proceso completado exitosamente.');
}

// Ejecutar el script
main().catch(error => {
  console.error('❌ Error en la ejecución principal:', error);
  process.exit(1);
});