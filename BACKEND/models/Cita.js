import mongoose from "mongoose";

const citaSchema = new mongoose.Schema(
  {
    // Email
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // validación de formato
    },

    especialidad: {
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

    fechaCita: {
      type: Date,
      required: true,
    },

    horario: {
      type: String,
      required: true,
    },

    motivoCita: {
      type: String,
      required: true,
      trim: true,
    },

    estado: {
      type: String,
      enum: ["pendiente", "confirmada", "completada", "cancelada"],
      default: "pendiente",
    },

    fechaRegistro: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Cita = mongoose.model("Cita", citaSchema);
export default Cita;
