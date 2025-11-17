// BACKEND/Routes/perfil.routes.js
import express from "express";
import {
  getPerfil,
  updatePerfil
} from "../controllers/perfil.controller.js";
import uploadProfile from "../Config/multer.profile.config.js";

const router = express.Router();

// Rutas para gestión de perfil del paciente
router.get("/perfil", getPerfil); // Obtener perfil por email (query param)
router.put("/perfil", uploadProfile.single("imagen"), updatePerfil); // Actualizar perfil por email (query param) con imagen opcional

export default router;

