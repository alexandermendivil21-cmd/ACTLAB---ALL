import express from "express";
import { 
  crearPago, 
  listarPagosPaciente, 
  listarPagosAdmin, 
  actualizarMetodoPago,
  getEstadisticasPagos
} from "../controllers/pagos.controller.js";

const router = express.Router();

router.get("/pagos/estadisticas", getEstadisticasPagos); // Estadísticas de pagos
router.post("/pagos", crearPago);
router.get("/pagos", listarPagosPaciente);
router.get("/admin/pagos", listarPagosAdmin);
router.put("/pagos/:pagoId/metodo", actualizarMetodoPago);

export default router;


