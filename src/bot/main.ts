import nodemailer from 'nodemailer';
import { Telegraf } from 'telegraf';

import  "dotenv/config";
import { chromium, type Browser } from '@playwright/test';
interface Config {
    url: string;
    checkInterval: number; // en milisegundos
    emailConfig: {
        to: string;
        from: string;
        subject: string;
    };
    telegramConfig: {
        enabled: boolean;
        chatId: string;
    };
}

class TicketScraper {
    private config: Config;
    private browser: Browser | null = null; // Cambiado a 'any' para Playwright
    private telegram: Telegraf | null = null;
    private emailTransporter: nodemailer.Transporter;

    constructor(config: Config) {
        this.config = config;

        // Inicializar transporter de email
        this.emailTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Inicializar bot de Telegram si está habilitado
        if (this.config.telegramConfig.enabled) {
            this.telegram = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
        }
    }

    private async initBrowser(): Promise<void> {
        try {
            this.browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        } catch (error) {
            console.error('Error al inicializar el navegador:', error);
            throw error;
        }
    }

    private async checkAvailability(): Promise<boolean> {
        if (!this.browser) {
            await this.initBrowser();
        }

        if (!this.browser) {
            throw new Error('Browser is not initialized');
        }
        const page = await this.browser.newPage();

        try {
            // Configurar interceptación de recursos para optimizar la velocidad
            await page.route('**/*', (route) => {
                const resourceType = route.request().resourceType();
                if (['image', 'stylesheet', 'font'].includes(resourceType)) {
                    route.abort();
                } else {
                    route.continue();
                }
            });

            // Navegar a la página con timeout y retry
            await this.retryOperation(async () => {
                await page.goto(this.config.url, { 
                    waitUntil: 'networkidle',
                    timeout: 30000 
                });
            }, 3);

            // Esperar por el selector específico
            const selector = '#tabla_tickets_sin_codigo > tbody > tr:nth-child(1) > td > div:nth-child(1) > div > table > tbody';
            await page.waitForSelector(selector);

            // Obtener el texto de la tercera columna
            const text = await page.evaluate((sel) => {
                const element = document.querySelector(sel);
                const thirdColumn = element?.querySelector('tr td:nth-child(3)');
                return thirdColumn?.textContent?.trim() || '';
            }, selector);

            return text.toLowerCase() !== 'agotado';

        } catch (error) {
            console.error('Error al verificar disponibilidad:', error);
            throw error;
        } finally {
            await page.close();
        }
    }

    private async sendEmail(message: string): Promise<void> {
        const mailOptions = {
            from: this.config.emailConfig.from,
            to: this.config.emailConfig.to,
            subject: this.config.emailConfig.subject,
            text: message
        };

        try {
            await this.emailTransporter.sendMail(mailOptions);
            console.log('Email enviado exitosamente');
        } catch (error) {
            console.error('Error al enviar email:', error);
        }
    }

    private async sendTelegramMessage(message: string): Promise<void> {
        if (this.telegram && this.config.telegramConfig.enabled) {
            try {
                await this.telegram.telegram.sendMessage(
                    this.config.telegramConfig.chatId,
                    message
                );
                console.log('Mensaje de Telegram enviado exitosamente');
            } catch (error) {
                console.error('Error al enviar mensaje de Telegram:', error);
            }
        }
    }

    private async retryOperation(operation: () => Promise<void>, maxRetries: number): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                await operation();
                return;
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    public async start(): Promise<void> {
        console.log('Iniciando monitoreo de tickets...');

        try {
            await this.initBrowser();

            setInterval(async () => {
                try {
                    const isAvailable = await this.checkAvailability();
                    
                    if (isAvailable) {
                        const message = '¡Hay tickets disponibles! Revisa la página ahora.';
                        await this.sendEmail(message);
                        await this.sendTelegramMessage(message);
                    }
                } catch (error) {
                    console.error('Error durante el ciclo de verificación:', error);
                }
            }, this.config.checkInterval);

        } catch (error) {
            console.error('Error fatal en el scraper:', error);
            if (this.browser) await this.browser.close();
            process.exit(1);
        }
    }
}

// Configuración de ejemplo
const config: Config = {
    url: 'https://www.passline.com/eventos/ph-carnavales-las-tablas-2025',
    checkInterval: 5 * 60 * 1000, // 5 minutos
    emailConfig: {
        to: 'tu@email.com',
        from: 'notificador@tudominio.com',
        subject: 'Notificación de Disponibilidad de Tickets'
    },
    telegramConfig: {
        enabled: true,
        chatId: 'TU_CHAT_ID'
    }
};

// Crear archivo .env con las siguientes variables:
// EMAIL_USER=tu_email@gmail.com
// EMAIL_PASSWORD=tu_password_de_aplicacion
// TELEGRAM_BOT_TOKEN=tu_token_de_bot

// Iniciar el scraper
const scraper = new TicketScraper(config);
scraper.start().catch(console.error);
