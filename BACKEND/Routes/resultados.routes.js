// BACKEND/Routes/resultados.routes.js
import express from "express";
import {
  getResultados,
  getResultadoById,
  createResultado,
  updateResultado,
  deleteResultado,
  getPDF,
} from "../controllers/resultado.controller.js";
import upload from "../config/multer.config.js";

const router = express.Router();

// Rutas para gestión de resultados
router.get("/", getResultados); // Obtener todos los resultados (o filtrar por email)
router.get("/:id", getResultadoById); // Obtener un resultado por ID
router.get("/:id/pdf", getPDF); // Obtener el PDF de un resultado
router.post("/", upload.single("pdf"), createResultado); // Crear un nuevo resultado con PDF
router.put("/:id", upload.single("pdf"), updateResultado); // Actualizar un resultado (con opción de actualizar PDF)
router.delete("/:id", deleteResultado); // Eliminar un resultado

export default router;

