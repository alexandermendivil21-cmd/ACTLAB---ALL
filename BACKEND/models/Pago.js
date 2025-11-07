import mongoose from "mongoose";

const pagoSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    citaId: { type: mongoose.Schema.Types.ObjectId, ref: "Cita", required: true },
    monto: { type: Number, required: true },
    metodo: { type: String, enum: ["tarjeta", "yape", "plin", "efectivo"], default: "tarjeta" },
    estado: { type: String, enum: ["pendiente", "pagado"], default: "pagado" },
  },
  { timestamps: true }
);

const Pago = mongoose.model("Pago", pagoSchema);
export default Pago;


