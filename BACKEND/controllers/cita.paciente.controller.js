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

    const nuevaCita = new Cita({
      email,
      especialidad,
      fechaCita,
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
