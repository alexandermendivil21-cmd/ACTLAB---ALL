import Cita from "../models/Cita.js";
import Usuario from "../models/Usuario.js";
import Muestra from "../models/Muestra.js";

// Crear nueva cita
export const crearCita = async (req, res) => {
  try {
    const { email, especialidad, fechaCita, horario, motivoCita } = req.body;

    if (!email || !especialidad || !fechaCita || !horario || !motivoCita) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ message: "El usuario no existe." });
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

    // Validar que no haya otra cita en el mismo horario exacto
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
        tipoError: "cita_misma_especialidad_fecha"
      });
    }

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

    // Si el motivo de la cita es "Análisis" o "Para sacar análisis", crear una muestra
    const motivosAnalisis = ["Análisis", "Para sacar análisis"];
    if (motivosAnalisis.includes(motivoCita)) {
      try {
        // Verificar si ya existe una muestra para esta cita
        const muestraExistente = await Muestra.findOne({ citaId: nuevaCita._id });
        if (!muestraExistente) {
          const nuevaMuestra = new Muestra({
            citaId: nuevaCita._id,
            email: email.toLowerCase(),
            estadoMuestra: "recolectada", // Estado inicial
          });
          await nuevaMuestra.save();
          console.log("✅ Muestra creada automáticamente para la cita:", nuevaCita._id);
        }
      } catch (error) {
        console.error("Error al crear muestra automáticamente:", error);
        // No fallar la creación de la cita si hay error al crear la muestra
      }
    }

    res.status(201).json({ message: "Cita creada correctamente.", cita: nuevaCita });
  } catch (error) {
    console.error("Error al crear la cita:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Obtener todas las citas
export const obtenerCitas = async (req, res) => {
  try {
    const citas = await Cita.find();
    res.json(citas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las citas." });
  }
};

// Obtener citas por email
export const obtenerCitaPorEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const citas = await Cita.find({ email });

    if (citas.length === 0) {
      return res.status(404).json({ message: "No se encontraron citas para este correo." });
    }

    res.json(citas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la cita por email." });
  }
};
