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

    // Tipo de muestra
    tipoMuestra: {
      type: String,
      enum: ["sangre", "orina", "heces", "otros"],
      required: true,
    },

    // Estado de la muestra
    estadoMuestra: {
      type: String,
      enum: ["pendiente", "en análisis", "completado"],
      default: "pendiente",
      required: true,
    },

    // Técnico de laboratorio asignado
    tecnicoLaboratorio: {
      type: String,
      trim: true,
      default: "",
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

