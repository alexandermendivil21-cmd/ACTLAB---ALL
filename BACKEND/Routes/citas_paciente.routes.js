// BACKEND/Routes/citas_paciente.routes.js
import express from "express";
import Cita from "../models/Cita.js";
import Pago from "../models/Pago.js";
import { crearNotificacion } from "../controllers/notificacion.controller.js";

const router = express.Router();

// Función para cancelar automáticamente citas no pagadas que ya pasaron
const cancelarCitasNoPagadasVencidas = async () => {
  try {
    const ahora = new Date();
    
    // Buscar citas pendientes que ya pasaron su fecha/hora
    const citasPendientes = await Cita.find({
      estado: { $in: ["pendiente", "Pendiente"] }
    });

    let citasCanceladas = 0;

    for (const cita of citasPendientes) {
      // Verificar si la cita ya pasó (fecha Y hora)
      const fechaCita = new Date(cita.fechaCita);
      
      // Extraer la hora del horario (puede venir en formato "HH:MM - HH:MM am/pm" o "HH:MM")
      let horaCita = 0;
      let minutosCita = 0;
      
      if (cita.horario) {
        const horarioStr = cita.horario.trim();
        // Buscar el patrón de hora:minutos (puede venir como "4:30 - 5:00 pm" o "08:00")
        const match = horarioStr.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          horaCita = parseInt(match[1]) || 0;
          minutosCita = parseInt(match[2]) || 0;
          
          // Convertir AM/PM a formato 24 horas
          const horarioLower = horarioStr.toLowerCase();
          if (horarioLower.includes('pm')) {
            // Si es PM y la hora es menor a 12, sumar 12 (ej: 4:30 pm -> 16:30)
            if (horaCita < 12) {
              horaCita += 12;
            }
          } else if (horarioLower.includes('am')) {
            // Si es AM y la hora es 12, convertir a 0 (12:00 am -> 00:00)
            if (horaCita === 12) {
              horaCita = 0;
            }
          }
        }
      }
      
      // Establecer la fecha y hora completa de la cita
      fechaCita.setHours(horaCita, minutosCita, 0, 0);
      
      // Si la fecha/hora de la cita ya pasó (es menor que ahora)
      if (fechaCita < ahora) {
        // Verificar si tiene pago
        const tienePago = await Pago.findOne({ citaId: cita._id });
        
        // Si no tiene pago, cancelar automáticamente
        if (!tienePago) {
          cita.estado = "cancelada";
          cita.canceladaPor = "sistema";
          await cita.save();
          
          // Crear notificación
          await crearNotificacion(
            "cita_cancelada_automatica",
            `Cita cancelada automáticamente: ${cita.email} - ${cita.especialidad} (${new Date(cita.fechaCita).toLocaleDateString()} ${cita.horario})`,
            { citaId: cita._id, email: cita.email, motivo: "No pagada antes de la hora de la cita" }
          );
          
          citasCanceladas++;
          console.log(`✅ Cita cancelada automáticamente: ${cita._id} - No pagada antes de la hora`);
        }
      }
    }

    if (citasCanceladas > 0) {
      console.log(`📋 Total de citas canceladas automáticamente: ${citasCanceladas}`);
    }

    return citasCanceladas;
  } catch (error) {
    console.error("Error al cancelar citas no pagadas vencidas:", error);
    return 0;
  }
};

// Obtener citas por email
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "El parámetro 'email' es obligatorio" });
    }

    // Cancelar automáticamente citas no pagadas que ya pasaron
    await cancelarCitasNoPagadasVencidas();

    const citas = await Cita.find({ email });
    console.log("Citas encontradas:", citas);

    res.status(200).json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error.message);
    res.status(500).json({ error: "Error al obtener citas", detalle: error.message });
  }
});



// Crear una cita
router.post("/", async (req, res) => {
  try {
    console.log("📥 Datos recibidos del frontend:", req.body); // 🔍 Ver qué llega realmente

    const { email, especialidad, fechaCita, horario, motivoCita } = req.body;

    if (!email || !especialidad || !fechaCita || !horario || !motivoCita) {
      console.warn("Faltan datos:", { email, especialidad, fechaCita, horario, motivoCita });
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Convertir la fecha correctamente para evitar problemas de zona horaria
    // Si viene como string "YYYY-MM-DD", crear una fecha local a medianoche
    let fechaCitaDate;
    if (typeof fechaCita === 'string') {
      // Parsear la fecha como fecha local (no UTC)
      const [year, month, day] = fechaCita.split('-').map(Number);
      fechaCitaDate = new Date(year, month - 1, day, 0, 0, 0, 0); // Mes es 0-indexed
    } else {
      fechaCitaDate = new Date(fechaCita);
    }

    // Validar que el paciente no tenga ya una cita de la misma especialidad el mismo día
    const inicioDia = new Date(fechaCitaDate);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fechaCitaDate);
    finDia.setHours(23, 59, 59, 999);

    // Buscar si el paciente ya tiene una cita de la misma especialidad en el mismo día
    const citaExistenteMismaEspecialidad = await Cita.findOne({
      email: email.toLowerCase(),
      especialidad: especialidad,
      fechaCita: {
        $gte: inicioDia,
        $lte: finDia
      },
      estado: { $in: ["pendiente", "confirmada"] } // Solo considerar citas activas
    });

    if (citaExistenteMismaEspecialidad) {
      return res.status(409).json({
        message: "Ya tienes una cita registrada para esta fecha",
        error: "Ya tienes una cita registrada para esta fecha",
        tipoError: "cita_misma_especialidad_fecha"
      });
    }

    // Validar que no haya otra cita en el mismo horario

    // Extraer la hora del horario (puede venir como "9:00 - 9:30 am" o "09:00")
    let horaCita = 0;
    let minutosCita = 0;
    const horarioStr = horario.trim();
    const match = horarioStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      horaCita = parseInt(match[1]) || 0;
      minutosCita = parseInt(match[2]) || 0;
      
      // Convertir AM/PM a formato 24 horas
      const horarioLower = horarioStr.toLowerCase();
      if (horarioLower.includes('pm') && horaCita < 12) {
        horaCita += 12;
      } else if (horarioLower.includes('am') && horaCita === 12) {
        horaCita = 0;
      }
    }

    // Buscar citas existentes en el mismo día con estado activo
    const citasExistentes = await Cita.find({
      fechaCita: {
        $gte: inicioDia,
        $lte: finDia
      },
      estado: { $in: ["pendiente", "confirmada"] } // Solo considerar citas activas
    });

    // Verificar si hay conflicto de horario exacto
    for (const citaExistente of citasExistentes) {
      if (citaExistente.horario) {
        // Extraer la hora de la cita existente
        let horaExistente = 0;
        let minutosExistente = 0;
        const horarioExistenteStr = citaExistente.horario.trim();
        const matchExistente = horarioExistenteStr.match(/(\d{1,2}):(\d{2})/);
        if (matchExistente) {
          horaExistente = parseInt(matchExistente[1]) || 0;
          minutosExistente = parseInt(matchExistente[2]) || 0;
          
          // Convertir AM/PM a formato 24 horas
          const horarioExistenteLower = horarioExistenteStr.toLowerCase();
          if (horarioExistenteLower.includes('pm') && horaExistente < 12) {
            horaExistente += 12;
          } else if (horarioExistenteLower.includes('am') && horaExistente === 12) {
            horaExistente = 0;
          }
        }

        // Verificar si el horario es exactamente el mismo
        if (horaCita === horaExistente && minutosCita === minutosExistente) {
          const fechaFormateada = fechaCitaDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          return res.status(409).json({ 
            message: `El horario ${horario} del ${fechaFormateada} ya está reservado. No pueden haber dos citas a la misma hora.`,
            conflicto: {
              fecha: fechaFormateada,
              horario: horario,
              horarioOcupado: citaExistente.horario
            }
          });
        }
      }
    }

    const nuevaCita = new Cita({
      email,
      especialidad,
      fechaCita: fechaCitaDate,
      horario,
      motivoCita,
    });

    await nuevaCita.save();

    console.log("✅ Cita guardada:", nuevaCita);
    res.status(201).json({
      message: "Cita guardada correctamente",
      cita: nuevaCita,
    });
  } catch (error) {
    console.error("💥 Error al guardar la cita:", error.message);
    res.status(500).json({ error: "Error al guardar la cita", detalle: error.message });
  }
});

// Actualizar una cita por ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaCita, horario, especialidad, motivoCita, estado } = req.body;
    
    // Obtener la cita actual para verificar cambios
    const citaActual = await Cita.findById(id);
    if (!citaActual) return res.status(404).json({ error: "Cita no encontrada" });

    // Verificar si se está cambiando la fecha o el horario (solo estos cambios cuentan como intentos)
    const estaCambiandoFechaOHorario = (fechaCita && new Date(fechaCita).getTime() !== new Date(citaActual.fechaCita).getTime()) || 
                                       (horario && horario !== citaActual.horario);

    // Si se está cambiando fecha o horario, verificar límite de intentos
    if (estaCambiandoFechaOHorario) {
      // Verificar si ya se alcanzó el límite de 2 intentos
      if (citaActual.intentosEdicion >= 2) {
        return res.status(403).json({ 
          error: "Ya no tienes más intentos de cambios en tu cita",
          intentosEdicion: citaActual.intentosEdicion,
          limiteAlcanzado: true
        });
      }
    }

    // Si se está cambiando la fecha o el horario, validar conflictos
    if (fechaCita || horario) {
      // Convertir la fecha correctamente si viene como string
      let fechaParaValidar;
      if (fechaCita) {
        if (typeof fechaCita === 'string') {
          const [year, month, day] = fechaCita.split('-').map(Number);
          fechaParaValidar = new Date(year, month - 1, day, 0, 0, 0, 0);
        } else {
          fechaParaValidar = new Date(fechaCita);
        }
      } else {
        fechaParaValidar = new Date(citaActual.fechaCita);
      }
      const horarioParaValidar = horario || citaActual.horario;
      const especialidadParaValidar = especialidad || citaActual.especialidad;

      // Convertir fechaCita a objeto Date para comparación
      const inicioDia = new Date(fechaParaValidar);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(fechaParaValidar);
      finDia.setHours(23, 59, 59, 999);

      // Validar que el paciente no tenga ya una cita de la misma especialidad el mismo día
      // Solo validar si se está cambiando la fecha
      if (fechaCita) {
        const citaExistenteMismaEspecialidad = await Cita.findOne({
          _id: { $ne: id }, // Excluir la cita actual
          email: citaActual.email.toLowerCase(),
          especialidad: especialidadParaValidar,
          fechaCita: {
            $gte: inicioDia,
            $lte: finDia
          },
          estado: { $in: ["pendiente", "confirmada"] } // Solo considerar citas activas
        });

        if (citaExistenteMismaEspecialidad) {
          return res.status(409).json({
            message: "Ya tienes una cita de esta especialidad para esta fecha",
            error: "Ya tienes una cita de esta especialidad para esta fecha",
            tipoError: "cita_misma_especialidad_fecha"
          });
        }
      }

      // Extraer la hora del horario (puede venir como "9:00 - 9:30 am" o "09:00")
      let horaCita = 0;
      let minutosCita = 0;
      const horarioStr = horarioParaValidar.trim();
      const match = horarioStr.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        horaCita = parseInt(match[1]) || 0;
        minutosCita = parseInt(match[2]) || 0;
        
        // Convertir AM/PM a formato 24 horas
        const horarioLower = horarioStr.toLowerCase();
        if (horarioLower.includes('pm') && horaCita < 12) {
          horaCita += 12;
        } else if (horarioLower.includes('am') && horaCita === 12) {
          horaCita = 0;
        }
      }

      // Buscar citas existentes en el mismo día (excluyendo la cita actual)
      const citasExistentes = await Cita.find({
        _id: { $ne: id }, // Excluir la cita actual
        fechaCita: {
          $gte: inicioDia,
          $lte: finDia
        },
        estado: { $in: ["pendiente", "confirmada"] } // Solo considerar citas activas
      });

      // Verificar si hay conflicto de horario exacto
      for (const cita of citasExistentes) {
        if (cita.horario) {
          // Extraer la hora de la cita existente
          let horaExistente = 0;
          let minutosExistente = 0;
          const horarioExistenteStr = cita.horario.trim();
          const matchExistente = horarioExistenteStr.match(/(\d{1,2}):(\d{2})/);
          if (matchExistente) {
            horaExistente = parseInt(matchExistente[1]) || 0;
            minutosExistente = parseInt(matchExistente[2]) || 0;
            
            // Convertir AM/PM a formato 24 horas
            const horarioExistenteLower = horarioExistenteStr.toLowerCase();
            if (horarioExistenteLower.includes('pm') && horaExistente < 12) {
              horaExistente += 12;
            } else if (horarioExistenteLower.includes('am') && horaExistente === 12) {
              horaExistente = 0;
            }
          }

          // Verificar si el horario es exactamente el mismo
          if (horaCita === horaExistente && minutosCita === minutosExistente) {
            // Formatear fecha y horario para el mensaje
            const fechaFormateada = fechaParaValidar.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            return res.status(409).json({ 
              message: `El horario ${horarioParaValidar} del ${fechaFormateada} ya está reservado. Por favor, seleccione otro horario.`,
              conflicto: {
                fecha: fechaFormateada,
                horario: horarioParaValidar,
                horarioOcupado: cita.horario
              }
            });
          }
        }
      }
    }

    const update = {};
    if (fechaCita) {
      // Convertir la fecha correctamente si viene como string
      if (typeof fechaCita === 'string') {
        const [year, month, day] = fechaCita.split('-').map(Number);
        update.fechaCita = new Date(year, month - 1, day, 0, 0, 0, 0);
      } else {
        update.fechaCita = new Date(fechaCita);
      }
    }
    if (horario) update.horario = horario;
    if (especialidad) update.especialidad = especialidad;
    if (motivoCita) update.motivoCita = motivoCita;
    if (estado) update.estado = estado;
    
    // Si se está cambiando fecha o horario, incrementar el contador de intentos
    if (estaCambiandoFechaOHorario) {
      update.intentosEdicion = (citaActual.intentosEdicion || 0) + 1;
    }
    
    // Marcar que la modificación fue realizada por el paciente
    update.modificadaPor = "paciente";

    const cita = await Cita.findByIdAndUpdate(id, update, { new: true });
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });

    await crearNotificacion(
      "cita_editada",
      `Cita editada para ${cita.email} el ${new Date(cita.fechaCita).toLocaleString()}`,
      { citaId: cita._id, email: cita.email, cambio: update }
    );

    res.json({ 
      message: "Cita actualizada", 
      cita,
      intentosEdicion: cita.intentosEdicion || 0,
      intentosRestantes: Math.max(0, 2 - (cita.intentosEdicion || 0))
    });
  } catch (error) {
    console.error("Error al actualizar cita:", error.message);
    res.status(500).json({ error: "Error al actualizar cita" });
  }
});

// Cancelar una cita por ID
router.patch("/:id/cancelar", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🚫 Cancelando cita:", id);
    
    // Marcar que la cancelación fue realizada por el paciente
    const cita = await Cita.findByIdAndUpdate(
      id, 
      { estado: "cancelada", canceladaPor: "paciente" }, 
      { new: true }
    );
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });

    console.log("✅ Cita cancelada por paciente:", {
      id: cita._id,
      email: cita.email,
      estado: cita.estado,
      canceladaPor: cita.canceladaPor
    });

    await crearNotificacion(
      "cita_cancelada",
      `Cita cancelada por ${cita.email} el ${new Date().toLocaleString()}`,
      { citaId: cita._id, email: cita.email }
    );

    res.json({ message: "Cita cancelada", cita });
  } catch (error) {
    console.error("Error al cancelar cita:", error.message);
    res.status(500).json({ error: "Error al cancelar cita" });
  }
});

export default router;
