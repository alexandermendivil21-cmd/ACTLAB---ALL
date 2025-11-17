import mongoose from "mongoose";

const diagnosticoSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    
    idMedico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personal",
      required: true,
    },
    
    fechaDiagnostico: {
      type: Date,
      required: true,
      default: Date.now,
    },
    
    diagnostico: {
      type: String,
      required: true,
      trim: true,
    },
    
    sintomas: {
      type: String,
      trim: true,
      default: "",
    },
    
    observaciones: {
      type: String,
      trim: true,
      default: "",
    },
    
    receta: {
      medicamentos: [
        {
          nombre: {
            type: String,
            required: true,
            trim: true,
          },
          dosis: {
            type: String,
            required: true,
            trim: true,
          },
          frecuencia: {
            type: String,
            required: true,
            trim: true,
          },
          duracion: {
            type: String,
            required: true,
            trim: true,
          },
          instrucciones: {
            type: String,
            trim: true,
            default: "",
          },
        },
      ],
      tieneReceta: {
        type: Boolean,
        default: false,
      },
    },
    
    estado: {
      type: String,
      enum: ["pendiente", "completado", "archivado"],
      default: "completado",
    },
  },
  { timestamps: true }
);

const Diagnostico = mongoose.model("Diagnostico", diagnosticoSchema);
export default Diagnostico;

