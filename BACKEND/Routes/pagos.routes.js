import express from "express";
import { crearPago, listarPagosPaciente, listarPagosAdmin } from "../controllers/pagos.controller.js";

const router = express.Router();

router.post("/pagos", crearPago);
router.get("/pagos", listarPagosPaciente);
router.get("/admin/pagos", listarPagosAdmin);

export default router;


