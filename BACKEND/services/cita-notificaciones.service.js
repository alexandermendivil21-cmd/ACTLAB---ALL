// BACKEND/services/cita-notificaciones.service.js
import Cita from "../models/Cita.js";
import Usuario from "../models/Usuario.js";
import { enviarNotificacionCita } from "./email.service.js";

/**
 * Extrae la hora y minutos del horario de la cita
 * @param {string} horario - Horario en formato "HH:MM - HH:MM am/pm" o "HH:MM"
 * @returns {Object} - { hora: number, minutos: number }
 */
const extraerHoraHorario = (horario) => {
  let horaCita = 0;
  let minutosCita = 0;

  if (horario) {
    const horarioStr = horario.trim();
    // Buscar el patrón de hora:minutos
    const match = horarioStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      horaCita = parseInt(match[1]) || 0;
      minutosCita = parseInt(match[2]) || 0;

      // Convertir AM/PM a formato 24 horas
      const horarioLower = horarioStr.toLowerCase();
      if (horarioLower.includes("pm")) {
        if (horaCita < 12) {
          horaCita += 12;
        }
      } else if (horarioLower.includes("am")) {
        if (horaCita === 12) {
          horaCita = 0;
        }
      }
    }
  }

  return { hora: horaCita, minutos: minutosCita };
};

/**
 * Verifica y envía notificaciones a pacientes cuyas citas están en 2 horas
 */
export const verificarYEnviarNotificaciones = async () => {
  try {
    console.log("🔍 Iniciando verificación de notificaciones de citas...");

    const ahora = new Date();
    const dosHorasDespues = new Date(ahora.getTime() + 2 * 60 * 60 * 1000); // 2 horas en milisegundos

    // Buscar citas confirmadas que:
    // 1. No hayan recibido la notificación aún
    // 2. Estén programadas para dentro de aproximadamente 2 horas
    // 3. No estén canceladas o completadas
    const citas = await Cita.find({
      estado: { $in: ["confirmada", "pendiente"] },
      notificacion2HorasEnviada: false,
    });

    let notificacionesEnviadas = 0;
    let errores = 0;

    for (const cita of citas) {
      try {
        // Construir la fecha y hora completa de la cita
        const fechaCita = new Date(cita.fechaCita);
        const { hora, minutos } = extraerHoraHorario(cita.horario);
        fechaCita.setHours(hora, minutos, 0, 0);

        // Calcular la diferencia en milisegundos
        const diferencia = fechaCita.getTime() - ahora.getTime();
        const horasDiferencia = diferencia / (1000 * 60 * 60);

        // Verificar si la cita está entre 1.5 y 2.5 horas en el futuro
        // (rango de tolerancia para evitar problemas de timing)
        if (horasDiferencia >= 1.5 && horasDiferencia <= 2.5) {
          // Obtener información del paciente
          const paciente = await Usuario.findOne({ email: cita.email });
          if (!paciente) {
            console.warn(`⚠️ Paciente no encontrado para cita ${cita._id}`);
            continue;
          }

          const nombrePaciente = `${paciente.nombres} ${paciente.apellidos}`;

          // Enviar la notificación
          const enviado = await enviarNotificacionCita(
            cita.email,
            nombrePaciente,
            {
              especialidad: cita.especialidad,
              fechaCita: fechaCita,
              horario: cita.horario,
              motivoCita: cita.motivoCita,
            }
          );

          if (enviado) {
            // Marcar la cita como notificada
            cita.notificacion2HorasEnviada = true;
            await cita.save();
            notificacionesEnviadas++;
            console.log(
              `✅ Notificación enviada para cita ${cita._id} (${cita.email})`
            );
          } else {
            errores++;
            console.error(
              `❌ Error al enviar notificación para cita ${cita._id}`
            );
          }
        }
      } catch (error) {
        errores++;
        console.error(
          `❌ Error procesando cita ${cita._id}:`,
          error.message
        );
      }
    }

    console.log(
      `📧 Verificación completada: ${notificacionesEnviadas} notificaciones enviadas, ${errores} errores`
    );

    return {
      notificacionesEnviadas,
      errores,
      totalCitasRevisadas: citas.length,
    };
  } catch (error) {
    console.error("❌ Error en verificarYEnviarNotificaciones:", error);
    throw error;
  }
};

