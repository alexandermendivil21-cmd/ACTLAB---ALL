import express from "express";
import {
  getPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  deletePaciente,
  getEstadisticasPacientes,
  getPacientesPorMes
} from "../controllers/paciente.controller.js";

const router = express.Router();

router.get("/pacientes/estadisticas", getEstadisticasPacientes); // Estadísticas de pacientes
router.get("/pacientes/por-mes", getPacientesPorMes); // Pacientes nuevos por mes
router.get("/pacientes", getPacientes);
router.get("/pacientes/:id", getPacienteById);
router.post("/pacientes", createPaciente);
router.put("/pacientes/:id", updatePaciente);
router.delete("/pacientes/:id", deletePaciente);

export default router;
