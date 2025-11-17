import express from "express";
import {
  getDiagnosticos,
  getDiagnosticoById,
  getDiagnosticosByEmail,
  createDiagnostico,
  updateDiagnostico,
  deleteDiagnostico
} from "../controllers/diagnostico.controller.js";

const router = express.Router();

router.get("/diagnosticos", getDiagnosticos);
router.get("/diagnosticos/email", getDiagnosticosByEmail);
router.get("/diagnosticos/:id", getDiagnosticoById);
router.post("/diagnosticos", createDiagnostico);
router.put("/diagnosticos/:id", updateDiagnostico);
router.delete("/diagnosticos/:id", deleteDiagnostico);

export default router;

