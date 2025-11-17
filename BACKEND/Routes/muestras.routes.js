// BACKEND/Routes/muestras.routes.js
import express from "express";
import {
  getMuestras,
  getMuestraById,
  createMuestra,
  updateMuestraEstado,
  deleteMuestra,
} from "../controllers/muestra.controller.js";

const router = express.Router();

// Rutas para gestión de muestras
router.get("/muestras", getMuestras);
router.get("/muestras/:id", getMuestraById);
router.post("/muestras", createMuestra);
router.put("/muestras/:id", updateMuestraEstado); // Solo técnicos pueden actualizar
router.delete("/muestras/:id", deleteMuestra);

export default router;

