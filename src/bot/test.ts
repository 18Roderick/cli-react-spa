import "dotenv/config";
import { Telegraf } from 'telegraf';

// Reemplaza 'YOUR_TOKEN' con el token de tu bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

console.log('Bot iniciado');
// Comando /start
bot.start((ctx) => {
    ctx.reply('¡Hola! Soy un bot de prueba. ¿Cómo puedo ayudarte?');
});

// Manejo de mensajes de texto
bot.on('text', (ctx) => {
    ctx.reply(`Has dicho: ${ctx.message.text}`);
});

// Manejo de errores
bot.catch((err) => {
    console.error(`Error en el bot: ${err}`);
});

// Inicia el bot
bot.launch().then(() => {
    console.log('Bot iniciado');
});

// Manejo de cierre del bot
process.once('SIGINT', () => {
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
});
