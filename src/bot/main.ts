import { chromium, type Browser } from '@playwright/test';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { Resend } from 'resend';

dotenv.config();

interface Config {
    url: string;
    checkInterval: number;
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
    private browser: Browser | null = null;
    private telegram: Telegraf | null = null;
    private resend: Resend;

    constructor(config: Config) {
        this.config = config;

        // Initialize Resend with API key
        this.resend = new Resend(process.env.RESEND_KEY || '');

        // Initialize Telegram bot if enabled
        if (this.config.telegramConfig.enabled) {
            this.telegram = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
        }
    }

    // Initialize the browser
    private async initBrowser(): Promise<void> {
        try {
            this.browser = await chromium.launch({
                headless: true
            });
        } catch (error) {
            console.error('Error initializing browser:', error);
            throw error;
        }
    }

    // Check ticket availability
    private async checkAvailability(): Promise<boolean> {
        if (!this.browser) {
            await this.initBrowser();
        }

        const context = await this.browser!.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 }
        });

        const page = await context.newPage();

        try {
            await page.setDefaultTimeout(30000);
            await page.setDefaultNavigationTimeout(30000);
            await page.route('**/*.{png,jpg,jpeg,gif,css,font}', route => route.abort());

            await this.retryOperation(async () => {
                await page.goto(this.config.url, {
                    waitUntil: 'networkidle'
                });
            }, 3);

            const selector = '#tabla_tickets_sin_codigo >> tbody >> tr:nth-child(1) >> td >> div:nth-child(1) >> div >> table >> tbody';
            await page.waitForSelector(selector);

            const text = await page.locator(`${selector} >> tr >> td:nth-child(3)`).textContent();

            return (text?.toLowerCase() ?? '') !== 'agotado';

        } catch (error) {
            console.error('Error checking availability:', error);
            throw error;
        } finally {
            await context.close();
        }
    }

    // Send email notification
    private async sendEmail(message: string): Promise<void> {
        const mailOptions = {
            from: this.config.emailConfig.from,
            to: this.config.emailConfig.to,
            subject: this.config.emailConfig.subject,
            text: message
        };

        try {
            await this.resend.emails.send(mailOptions);
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    // Send Telegram message
    private async sendTelegramMessage(message: string): Promise<void> {
        if (this.telegram && this.config.telegramConfig.enabled) {
            try {
                await this.telegram.telegram.sendMessage(
                    this.config.telegramConfig.chatId,
                    message
                );
                console.log('Telegram message sent successfully');
            } catch (error) {
                console.error('Error sending Telegram message:', error);
            }
        }
    }

    // Retry operation with exponential backoff
    private async retryOperation(operation: () => Promise<void>, maxRetries: number): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                await operation();
                return;
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }

    // Start the ticket scraper
    public async start(): Promise<void> {
        console.log('Starting ticket monitoring...');

        try {
            await this.initBrowser();

            let lastStatus = false;

            setInterval(async () => {
                try {
                    const isAvailable = await this.checkAvailability();

                    if (isAvailable && !lastStatus) {
                        const message = 'Tickets are available! Check the page now.';
                        await Promise.all([
                            this.sendEmail(message),
                            this.sendTelegramMessage(message)
                        ]);
                    }

                    lastStatus = isAvailable;

                } catch (error) {
                    console.error('Error during verification cycle:', error);
                }
            }, this.config.checkInterval);

        } catch (error) {
            console.error('Fatal error in scraper:', error);
            if (this.browser) await this.browser.close();
            process.exit(1);
        }
    }

    // Stop the ticket scraper
    public async stop(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Example configuration
const config: Config = {
    url: 'https://www.passline.com/eventos/ph-carnavales-las-tablas-2025',
    checkInterval: 5 * 60 * 1000, // 5 minutes
    emailConfig: {
        to: 'roderickromero4@gmail.com',
        from: 'rode_rick@live.com',
        subject: 'Ticket Availability Notification'
    },
    telegramConfig: {
        enabled: true,
        chatId: process.env.TELEGRAM_BOT_TOKEN!
    }
};

// Start the scraper
const scraper = new TicketScraper(config);
scraper.start().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Stopping the scraper...');
    await scraper.stop();
    process.exit(0);
});
