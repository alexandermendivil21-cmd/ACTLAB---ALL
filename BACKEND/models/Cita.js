import mongoose from "mongoose";

const citaSchema = new mongoose.Schema({
  pacienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  medicoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  fechaHora: {
    type: Date,
    required: true,
  },
  motivo: {
    type: String,
    required: true,
    trim: true,
  },
  estado: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });

const Cita = mongoose.model("Cita", citaSchema);
export default Cita;