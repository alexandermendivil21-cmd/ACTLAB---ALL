import Pago from "../models/Pago.js";
import Cita from "../models/Cita.js";
import { crearNotificacion } from "./notificacion.controller.js";

export const crearPago = async (req, res) => {
  try {
    const { email, citaId, monto, metodo } = req.body;
    if (!email || !citaId || !monto) return res.status(400).json({ message: "Datos incompletos" });

    const cita = await Cita.findById(citaId);
    if (!cita) return res.status(404).json({ message: "Cita no encontrada" });

    const pago = new Pago({ email, citaId, monto, metodo: metodo || "tarjeta", estado: "pagado" });
    await pago.save();

    await crearNotificacion(
      "pago_realizado",
      `Pago recibido de ${email} por S/ ${monto}`,
      { pagoId: pago._id, email, citaId }
    );

    res.status(201).json({ message: "Pago registrado", pago });
  } catch (e) {
    console.error("Error crearPago:", e.message);
    res.status(500).json({ message: "Error al registrar pago" });
  }
};

export const listarPagosPaciente = async (req, res) => {
  try {
    const { email } = req.query;
    const filtro = email ? { email } : {};
    const pagos = await Pago.find(filtro).sort({ createdAt: -1 });
    res.json(pagos);
  } catch (e) {
    res.status(500).json({ message: "Error al listar pagos" });
  }
};

export const listarPagosAdmin = async (req, res) => {
  try {
    const pagos = await Pago.find().sort({ createdAt: -1 });
    res.json(pagos);
  } catch (e) {
    res.status(500).json({ message: "Error al listar pagos" });
  }
};


