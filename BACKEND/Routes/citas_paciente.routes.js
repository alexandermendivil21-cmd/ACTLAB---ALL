// BACKEND/Routes/citas_paciente.routes.js
import express from "express";
import Cita from "../models/Cita.js";
import { crearNotificacion } from "../controllers/notificacion.controller.js";

const router = express.Router();


// Obtener citas por email
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "El parámetro 'email' es obligatorio" });
    }

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

    const nuevaCita = new Cita({
      email,
      especialidad,
      fechaCita,
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
    const update = {};
    if (fechaCita) update.fechaCita = fechaCita;
    if (horario) update.horario = horario;
    if (especialidad) update.especialidad = especialidad;
    if (motivoCita) update.motivoCita = motivoCita;
    if (estado) update.estado = estado;

    const cita = await Cita.findByIdAndUpdate(id, update, { new: true });
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });

    await crearNotificacion(
      "cita_editada",
      `Cita editada para ${cita.email} el ${new Date(cita.fechaCita).toLocaleString()}`,
      { citaId: cita._id, email: cita.email, cambio: update }
    );

    res.json({ message: "Cita actualizada", cita });
  } catch (error) {
    console.error("Error al actualizar cita:", error.message);
    res.status(500).json({ error: "Error al actualizar cita" });
  }
});

// Cancelar una cita por ID
router.patch("/:id/cancelar", async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findByIdAndUpdate(id, { estado: "cancelada" }, { new: true });
    if (!cita) return res.status(404).json({ error: "Cita no encontrada" });

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
