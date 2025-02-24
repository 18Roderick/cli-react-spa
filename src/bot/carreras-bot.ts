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
  availability?: {
    price?: string;
    registrationStatus?: string;
    additionalInfo?: string[];
  };
}

// Configuración
const config = {
  url: 'https://carreraspanama.com/',
  selector: '#eventos2 > div > div > div > div > div.col-lg-4.col-md-6 > div',
  infoSelector: '#informacion',
  outputFile: 'carreras_panama_eventos.json',
  maxConcurrentPages: 3 // Limitar navegación concurrente para evitar sobrecarga
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
    
    // Ahora visitamos cada enlace para obtener la información de disponibilidad
    console.log('🔍 Obteniendo información detallada de cada evento...');
    
    // Procesamos los enlaces en grupos para limitar la concurrencia
    const eventsWithDetails: RaceEvent[] = [];
    
    // Creamos grupos de enlaces para procesarlos por lotes
    for (let i = 0; i < events.length; i += config.maxConcurrentPages) {
      const eventsGroup = events.slice(i, i + config.maxConcurrentPages);
      
      const detailedEventsGroup = await Promise.all(
        eventsGroup.map(async (event) => {
          return await getEventAvailability(browser!, event);
        })
      );
      
      eventsWithDetails.push(...detailedEventsGroup);
      console.log(`✅ Procesados ${eventsWithDetails.length} de ${events.length} eventos`);
    }
    
    return eventsWithDetails;
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

// Función para obtener la disponibilidad de un evento específico
async function getEventAvailability(browser: Browser, event: RaceEvent): Promise<RaceEvent> {
  // Verificamos si tenemos enlaces válidos para visitar
  const linksToCheck = [
    event.link, 
    ...event.registrationLinks.map(link => link.url)
  ].filter(link => link !== '#' && link.startsWith('http'));
  
  if (linksToCheck.length === 0) {
    console.log(`⚠️ No hay enlaces válidos para el evento: ${event.title}`);
    return event;
  }
  
  let page: Page | null = null;
  
  try {
    page = await browser.newPage();
    
    // Intentamos cada enlace hasta encontrar la información
    for (const link of linksToCheck) {
      try {
        console.log(`🔗 Visitando enlace: ${link}`);
        await page.goto(link, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Verificamos si existe el selector de información
        const infoExists = await page.$(config.infoSelector);
        
        if (infoExists) {
          // Extraemos la información de disponibilidad
          event.availability = await page.evaluate((selector) => {
            const infoContainer = document.querySelector(selector);
            
            if (!infoContainer) return undefined;
            
            // Extraer precio
            const priceElement = infoContainer.querySelector('.price ins, span.in-stock');
            const price = priceElement?.textContent?.trim() || '';
            
            // Extraer estado de inscripciones
            let registrationStatus = '';
            const statusElement = infoContainer.querySelector('.in-stock strong');
            
            if (statusElement) {
              registrationStatus = statusElement.textContent?.trim() || '';
            } else {
              // Buscamos textos que indiquen disponibilidad
              const fullText = infoContainer.textContent || '';
              if (fullText.includes('Agotado') || fullText.includes('Agotados')) {
                registrationStatus = 'Agotados';
              } else if (fullText.includes('Disponible') || fullText.includes('Disponibles')) {
                registrationStatus = 'Disponibles';
              }
            }
            
            // Extraer información adicional
            const additionalInfo: string[] = [];
            const paragraphs = infoContainer.querySelectorAll('p');
            paragraphs.forEach(p => {
              const text = p.textContent?.trim();
              if (text && !text.includes('Inscripciones:') && !text.startsWith('Precio')) {
                additionalInfo.push(text);
              }
            });
            
            return {
              price,
              registrationStatus,
              additionalInfo
            };
          }, config.infoSelector);
          
          console.log(`✅ Información encontrada para: ${event.title}`);
          break; // Salimos del bucle si encontramos la información
        }
      } catch (error) {
        console.error(`⚠️ Error al visitar el enlace ${link}:`, error);
        // Continuamos con el siguiente enlace
      }
    }
    
    return event;
  } catch (error) {
    console.error(`❌ Error al obtener disponibilidad para ${event.title}:`, error);
    return event;
  } finally {
    if (page) {
      await page.close();
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