import mongoose from "mongoose";

const muestraSchema = new mongoose.Schema(
  {
    // Referencia a la cita (para obtener fecha de recolección)
    citaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cita",
      required: true,
    },

    // Email del paciente (para obtener nombre)
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    // Estado de la muestra
    estadoMuestra: {
      type: String,
      enum: ["recolectada", "en-proceso"],
      default: "recolectada",
      required: true,
    },

    // Observaciones adicionales
    observaciones: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const Muestra = mongoose.model("Muestra", muestraSchema);
export default Muestra;

