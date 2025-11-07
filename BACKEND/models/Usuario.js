import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    tipo_documento: {
      type: String,
      enum: ["dni", "pasaporte", "carnet-ext"],
      required: true,
    },
    num_documento: {
      type: String,
      required: true,
      unique: true, // cada documento debe ser único
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
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // valida formato básico de email
    },
    password: {
      type: String,
      required: true,
    },
    /*password_create: {
      type: String,
      required: true,
    }, */ 
  },
  { timestamps: true }
);

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;
