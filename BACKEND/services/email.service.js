// BACKEND/services/email.service.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configurar el transportador de correo
// Por defecto usa Gmail, pero puede configurarse con otras opciones
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Verificar la configuración del correo
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Error en la configuración de correo:", error);
      console.warn("⚠️ Las notificaciones por correo no funcionarán hasta que se configure correctamente.");
    } else {
      console.log("✅ Servidor de correo listo para enviar mensajes");
    }
  });
} else {
  console.warn("⚠️ EMAIL_USER o EMAIL_PASSWORD no están configurados en .env");
  console.warn("⚠️ Las notificaciones por correo estarán deshabilitadas.");
}

/**
 * Envía un correo de notificación al paciente sobre su cita próxima
 * @param {string} emailDestino - Email del paciente
 * @param {string} nombrePaciente - Nombre completo del paciente
 * @param {Object} datosCita - Datos de la cita (especialidad, fecha, horario)
 * @returns {Promise<boolean>} - true si se envió correctamente, false en caso contrario
 */
export const enviarNotificacionCita = async (emailDestino, nombrePaciente, datosCita) => {
  // Verificar si el transportador está configurado
  if (!transporter) {
    console.warn("⚠️ Servicio de correo no configurado. No se puede enviar notificación.");
    return false;
  }

  try {
    // Formatear la fecha de la cita
    const fechaCita = new Date(datosCita.fechaCita);
    const fechaFormateada = fechaCita.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Crear el contenido del correo
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #1976d2;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .info-box {
            background-color: white;
            border-left: 4px solid #1976d2;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-item {
            margin: 10px 0;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #777;
            font-size: 12px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📅 Recordatorio de Cita</h1>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${nombrePaciente}</strong>,</p>
          
          <p>Le recordamos que tiene una cita programada en <strong>2 horas</strong>:</p>
          
          <div class="info-box">
            <div class="info-item">
              <span class="info-label">Especialidad:</span> ${datosCita.especialidad}
            </div>
            <div class="info-item">
              <span class="info-label">Fecha:</span> ${fechaFormateada}
            </div>
            <div class="info-item">
              <span class="info-label">Horario:</span> ${datosCita.horario}
            </div>
            <div class="info-item">
              <span class="info-label">Motivo:</span> ${datosCita.motivoCita}
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Importante:</strong> Por favor, asegúrese de llegar a tiempo para su cita.
          </div>

          <p>Si necesita cancelar o reprogramar su cita, puede hacerlo desde su panel de usuario.</p>
          
          <p>Saludos cordiales,<br><strong>Equipo ACTLAB</strong></p>
        </div>
        <div class="footer">
          <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
      </body>
      </html>
    `;

    // Configurar el correo
    const mailOptions = {
      from: `"ACTLAB" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: `⏰ Recordatorio: Su cita es en 2 horas - ${datosCita.especialidad}`,
      html: htmlContent,
    };

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de notificación enviado a ${emailDestino}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`❌ Error al enviar correo a ${emailDestino}:`, error.message);
    return false;
  }
};

export default transporter;

