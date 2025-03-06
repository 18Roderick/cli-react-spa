import { chromium, type Browser, type Page } from 'playwright';
import fs from 'fs/promises';
import { Resend } from 'resend';

import "dotenv/config";


import { generateEmailHtml } from './email-template';
import type { text } from 'stream/consumers';


// Definición estricta de la interfaz para eventos de carreras
export interface RaceEvent {
    title: string;
    date: string;
    link: string;
    imageUrl: string;
    registrationLinks: {
        type: string;
        url: string;
    }[];
    availability?: {
        type?: string;
        price?: string;
        registrationStatus?: string;
        isAvailable: boolean; // Campo específico para indicar disponibilidad
        additionalInfo?: string[];
    }[];
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
    const linksToCheck = event.registrationLinks.filter(link => link.url !== '#' && link.url.startsWith('http'));

    if (linksToCheck.length === 0) {
        console.log(`⚠️ No hay enlaces válidos para el evento: ${event.title}`);
        return event;
    }

    let page: Page | null = null;

    event.availability = []; // Inicializamos la información de disponibilidad
    try {
        page = await browser.newPage();

        // Intentamos cada enlace hasta encontrar la información

        for (const { url: link, type } of linksToCheck) {
            try {
                console.log(`🔗 Visitando enlace: ${link}`);
                await page.goto(link, { waitUntil: 'networkidle', timeout: 30000 });

                // Verificamos si existe el selector de información
                const infoExists = await page.$(config.infoSelector);

                if (infoExists) {
                    // Extraemos la información de disponibilidad               
                    const newEvent = await page.evaluate(([selector, type]) => {
                        const infoContainer = document.querySelector(selector);

                        if (!infoContainer) return { isAvailable: false };

                        // Extraer precio
                        const priceElement = infoContainer.querySelector('.price ins, span.in-stock');
                        const price = priceElement?.textContent?.trim() || '';

                        // Extraer estado de inscripciones y verificar disponibilidad
                        let registrationStatus = '';
                        let isAvailable = true; // Por defecto asumimos que está disponible

                        // Método 1: Buscar el texto específico "Inscripciones: Agotados"
                        const infoHTML = infoContainer.innerHTML || '';
                        console.log('\n\nHTML:', infoHTML);
                        if (infoHTML.includes('Inscripciones:') && infoHTML.includes('Agotados')) {
                            isAvailable = false;
                            registrationStatus = 'Agotados';
                        }

                        // Método 2: Buscar el elemento específico con el texto
                        const statusElement = infoContainer.querySelector('.in-stock strong');
                        if (statusElement) {
                            registrationStatus = statusElement.textContent?.trim() || '';
                            // Si dice explícitamente "Agotados", no está disponible
                            if (registrationStatus === 'Agotados') {
                                isAvailable = false;
                            }
                        }

                        // Método 3: Analizar el texto completo en busca de indicadores de disponibilidad
                        const fullText = infoContainer.textContent || '';
                        if (fullText.includes('Agotado') || fullText.includes('Agotados')) {
                            registrationStatus = registrationStatus || 'Agotados';
                            isAvailable = false;
                        } else if (fullText.includes('Disponible') || fullText.includes('Disponibles')) {
                            registrationStatus = registrationStatus || 'Disponibles';
                            isAvailable = true;
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

                        console.log(`Disponibilidad para evento: ${isAvailable ? 'Disponible' : 'Agotado'}`);

                        return {
                            type,
                            price,
                            registrationStatus,
                            isAvailable,
                            additionalInfo
                        };
                    }, [config.infoSelector, type]);

                    event.availability.push(newEvent);

                    console.log(`✅ Información encontrada para: ${event.title} - Disponible: ${newEvent.isAvailable ? 'Sí' : 'No'}`);
                    // break; // Salimos del bucle si encontramos la información
                }
            } catch (error) {
                console.error(`⚠️ Error al visitar el enlace ${link}:`, error);
                // Continuamos con el siguiente enlace
            }
        }

        // Si no se encontró información de disponibilidad, establecemos un valor predeterminado
        if (!event.availability || event.availability.length === 0) {
            console.log(`⚠️ No se encontró información de disponibilidad para ${event.title}`);
            event.availability = [{
                isAvailable: false,
                type: 'Desconocido',
                registrationStatus: 'Desconocido'
            }];
        }

        return event;
    } catch (error) {
        console.error(`❌ Error al obtener disponibilidad para ${event.title}:`, error);
        // En caso de error, establecemos un valor predeterminado
        event.availability = [{
            type: 'Desconocido',
            isAvailable: false,
            registrationStatus: 'Error al obtener disponibilidad'
        }];
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

function getListEmails() {
    const emails = process.env.EMAILS_SUBCRIPTIONS;

    if (!emails) throw new Error('No se encontraron emails de suscripción');

    if (emails.includes(',')) {
        return emails.split(',');
    }

    return [emails];
}

//enviar emails de boletos disponibles
async function sendEmails(events: RaceEvent[]): Promise<void> {
    //PAGAR CON YAPPY
    const config = getEnvVariables();
    const mailOptions = {
        to: getListEmails(),
        from: config.emailSender,
        subject: '🎉 Eventos Disponibles con Pago Yappy',
        html: generateEmailHtml(events),

    };
    // Verificar si hay eventos disponibles para pagar con Yappy
    const yappyEvents = events.some(event => event.availability?.some(
        (availability) => availability.type === "PAGAR CON YAPPY" && availability.isAvailable))

    if (!yappyEvents) return;

    const resend = new Resend(process.env.RESEND_KEY || '')
    try {
        await resend.emails.send(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

function getEnvVariables() {
    if (!process.env.EMAIL_SENDER) {
        throw new Error('No se encontró el email del remitente');
    }

    if (!process.env.RESEND_KEY) {
        throw new Error('No se encontró la clave de Resend');
    }

    if (!process.env.EMAILS_SUBCRIPTIONS) {
        throw new Error('No se encontraron emails de suscripción');
    }

    return {
        emailSender: process.env.EMAIL_SENDER,
        resendKey: process.env.RESEND_KEY,
        emailsSubscriptions: process.env.EMAILS_SUBCRIPTIONS
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
    //await saveEventsToFile(events, config.outputFile);
    // send emails
    await sendEmails(events);
    console.log('✅ Proceso completado exitosamente.');
}

//validar si existen las variables necesarias
getEnvVariables();

// main().catch(error => {
//     console.error('❌ Error en la ejecución principal:', error);
//     process.exit(1);
// });

setInterval(() => {
    // Ejecutar el script

    main().catch(error => {
        console.error('❌ Error en la ejecución principal:', error);
        process.exit(1);
    });

}, 1000 * 60 * 15); // Ejecutar cada 5 minutos