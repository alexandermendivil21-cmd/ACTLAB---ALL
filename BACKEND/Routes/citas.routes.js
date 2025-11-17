import express from "express";
import {
  getCitas,
  getCitaById,
  createCita,
  updateCita,
  deleteCita,
  contarCitasPorEstado,
  getEstadisticasCitas,
  getCitasSemana
} from "../controllers/cita.controller.js";

const router = express.Router();

// Rutas para gestión de citas (admin)
// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros
router.get("/estadisticas", getEstadisticasCitas); // Estadísticas generales de citas
router.get("/semana", getCitasSemana); // Citas de la semana actual
router.get("/contar/estados", contarCitasPorEstado); // Contar citas por estado y cambiadas
router.get("/", getCitas); // Obtener todas las citas (o filtrar por email con query param)
router.get("/:id", getCitaById); // Obtener una cita por ID
router.post("/", createCita); // Crear una nueva cita
router.put("/:id", updateCita); // Actualizar una cita
router.delete("/:id", deleteCita); // Eliminar una cita

export default router;