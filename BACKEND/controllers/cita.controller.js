// BACKEND/controllers/cita.controller.js
import Cita from "../models/Cita.js";
import Usuario from "../models/Usuario.js";

// Obtener todas las citas (para admin)
export const getCitas = async (req, res) => {
  try {
    const { email } = req.query;
    
    // Si se proporciona email, filtrar por email
    // Si no, devolver todas las citas (para admin)
    const query = email ? { email } : {};
    const citas = await Cita.find(query).sort({ fechaCita: 1 });
    
    res.status(200).json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ error: "Error al obtener las citas", detalle: error.message });
  }
};

// Obtener una cita por ID
export const getCitaById = async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findById(id);
    
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    
    res.status(200).json(cita);
  } catch (error) {
    console.error("Error al obtener la cita:", error);
    res.status(500).json({ error: "Error al obtener la cita", detalle: error.message });
  }
};

// Crear una nueva cita
export const createCita = async (req, res) => {
  try {
    const { email, especialidad, fechaCita, horario, motivoCita, estado } = req.body;

    if (!email || !especialidad || !fechaCita || !horario || !motivoCita) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ error: "El usuario no existe" });
    }

    const nuevaCita = new Cita({
      email,
      especialidad,
      fechaCita,
      horario,
      motivoCita,
      estado: estado || "pendiente",
    });

    await nuevaCita.save();
    res.status(201).json({
      message: "Cita creada correctamente",
      cita: nuevaCita,
    });
  } catch (error) {
    console.error("Error al crear la cita:", error);
    res.status(500).json({ error: "Error al crear la cita", detalle: error.message });
  }
};

// Actualizar una cita
export const updateCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, especialidad, fechaCita, horario, motivoCita, estado } = req.body;

    const cita = await Cita.findById(id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Actualizar campos si se proporcionan
    if (email) cita.email = email;
    if (especialidad) cita.especialidad = especialidad;
    if (fechaCita) cita.fechaCita = fechaCita;
    if (horario) cita.horario = horario;
    if (motivoCita) cita.motivoCita = motivoCita;
    if (estado) cita.estado = estado;

    await cita.save();
    res.status(200).json({
      message: "Cita actualizada correctamente",
      cita: cita,
    });
  } catch (error) {
    console.error("Error al actualizar la cita:", error);
    res.status(500).json({ error: "Error al actualizar la cita", detalle: error.message });
  }
};

// Eliminar una cita
export const deleteCita = async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findByIdAndDelete(id);
    
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    
    res.status(200).json({ message: "Cita eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la cita:", error);
    res.status(500).json({ error: "Error al eliminar la cita", detalle: error.message });
  }
};

