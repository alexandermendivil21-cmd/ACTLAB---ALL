import mongoose from "mongoose";

const personalSchema = new mongoose.Schema(
  {
    tipo_documento: {
      type: String,
      enum: ["dni", "pasaporte", "carnet-ext"],
      required: true,
    },
    num_documento: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fecha_emision: {
      type: Date,
      required: true,
    },
    nombres: {
      type: String,
      required: true,
      trim: true,
    },
    apellidos: {
      type: String,
      required: true,
      trim: true,
    },
    edad: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },
    genero: {
      type: String,
      enum: ["masculino", "femenino", "otro", "no-especifica"],
      required: true,
    },
    direccion: {
      type: String,
      required: true,
      trim: true,
    },
    celular: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
    },
    cargo: {
      type: String,
      enum: ["medico", "tecnico", "recepcionista"],
      required: true,
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
        "Medicina General",
        "N/A",
      ],
      default: "N/A",
    },
    estado: {
      type: String,
      enum: ["activo", "inactivo", "vacaciones"],
      default: "activo",
    },
    imagen: {
      type: String,
      default: null,
      trim: true,
    },
    horariosDisponibilidad: {
      type: [
        {
          diaSemana: {
            type: String,
            enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
            required: true,
          },
          horaInicio: {
            type: String,
            required: true,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // Formato HH:mm
          },
          horaFin: {
            type: String,
            required: true,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // Formato HH:mm
          },
          disponible: {
            type: Boolean,
            default: true,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Personal = mongoose.model("Personal", personalSchema);
export default Personal;

