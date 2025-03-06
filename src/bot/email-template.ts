import type { RaceEvent } from "./carreras-bot";

// Función para generar el HTML
export const generateEmailHtml = (events: RaceEvent[]): string => {
    const yappyEvents = events.filter((event) =>
        event.availability?.some(
            (availability) => availability.type === "PAGAR CON YAPPY" && availability.isAvailable
        ) ?? false
    );

    if (yappyEvents.length === 0) {
        return "<p>No hay eventos disponibles con pago Yappy.</p>";
    }

    const eventHtml = yappyEvents
        .map(
            (event) => `
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); font-family: Arial, sans-serif;">
          <div style="text-align: center; background: #ff6b6b; color: #ffffff; padding: 20px;">
            <h1 style="margin: 0; font-size: 24px;">🎉 ¡Eventos Disponibles con Pago Yappy!</h1>
          </div>
  
          <div style="padding: 20px;">
            <img 
              src="${event.imageUrl}" 
              alt="${event.title}" 
              style="width: 100%; border-radius: 10px 10px 0 0; display: block;"
            />
  
            <h2 style="font-size: 22px; font-weight: bold; margin: 20px 0 10px;">${event.title}</h2>
            <p style="font-size: 16px; color: #ff6b6b; margin: 0 0 20px;">📅 Fecha: ${event.date}</p>
  
            <div style="text-align: center;">
              <a 
                href="${event.registrationLinks.find((link: any) => link.type === "PAGAR CON YAPPY")?.url
                }"
                style="background-color: #ff6b6b; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; display: inline-block; margin-bottom: 20px;"
              >
                🛒 Pagar con Yappy
              </a>
            </div>
  
            <div style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
              <h3 style="font-size: 18px; margin: 0;">💳 Pago con Yappy</h3>
              <p style="font-size: 14px; margin: 5px 0;">🎟️ Precio: ${event.availability?.find((a: any) => a.type === "PAGAR CON YAPPY")?.price ?? 'N/A'
                }</p>
              <p style="font-size: 14px; color: #2ecc71; font-weight: bold; margin: 5px 0;">✅ Disponibles</p>
            </div>
          </div>
        </div>
      `
        )
        .join("");

    return  eventHtml;
};

