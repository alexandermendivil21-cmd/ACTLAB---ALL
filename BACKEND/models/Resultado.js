// BACKEND/models/Resultado.js
import mongoose from "mongoose";

const resultadoSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    tipoExamen: {
      type: String,
      enum: [
        "Cardiología",
        "Dermatología",
        "Pediatría",
        "Traumatología",
        "Neurología",
        "Hematología",
        "Inmunología",
        "Bioquímica",
      ],
      required: true,
    },

    idCita: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cita",
      required: false,
    },

    fechaExamen: {
      type: Date,
      required: true,
    },

    fechaResultado: {
      type: Date,
      default: Date.now,
    },

    archivoPDF: {
      type: String,
      required: true,
    },

    nombreArchivo: {
      type: String,
      required: true,
    },

    observaciones: {
      type: String,
      trim: true,
      default: "",
    },

    estado: {
      type: String,
      enum: ["pendiente", "disponible", "procesando"],
      default: "disponible",
    },
  },
  { timestamps: true }
);

const Resultado = mongoose.model("Resultado", resultadoSchema);
export default Resultado;

