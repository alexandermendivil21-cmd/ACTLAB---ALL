import mongoose from "mongoose";

const notificacionSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ["cita_cancelada", "cita_editada", "pago_realizado"],
      required: true,
    },
    mensaje: { type: String, required: true },
    datos: { type: Object, default: {} },
    leida: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notificacion = mongoose.model("Notificacion", notificacionSchema);
export default Notificacion;


