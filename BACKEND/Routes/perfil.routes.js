// BACKEND/Routes/perfil.routes.js
import express from "express";
import {
  getPerfil,
  updatePerfil
} from "../controllers/perfil.controller.js";

const router = express.Router();

// Rutas para gestión de perfil del paciente
router.get("/perfil", getPerfil); // Obtener perfil por email (query param)
router.put("/perfil", updatePerfil); // Actualizar perfil por email (query param)

export default router;

