import express from "express";
import { getNotificaciones, marcarLeida } from "../controllers/notificacion.controller.js";

const router = express.Router();

router.get("/notificaciones", getNotificaciones);
router.put("/notificaciones/:id/leida", marcarLeida);

export default router;


