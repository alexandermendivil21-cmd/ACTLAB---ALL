// controllers/paciente.controller.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Usuario from "../models/Usuario.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const getPacientes = async (req, res) => {
  try {
    // Obtener usuarios y seleccionar solo los campos necesarios
    const pacientes = await Usuario.find({}, {
      nombres: 1,
      apellidos: 1,
      edad: 1,
      genero: 1,
      direccion: 1,
      celular: 1,
      email: 1 // Incluimos email para referencia, pero no lo mostramos en la tabla
    }).sort({ createdAt: -1 });
    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener pacientes", error });
  }
};

// --- Obtener un paciente por ID ---
export const getPacienteById = async (req, res) => {
  try {
    const paciente = await Usuario.findById(req.params.id, {
      nombres: 1,
      apellidos: 1,
      edad: 1,
      genero: 1,
      direccion: 1,
      celular: 1,
      email: 1
    });
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }
    res.json(paciente);
  } catch (error) {
    res.status(500).json({ message: "Error al buscar paciente", error });
  }
};

// --- Crear un paciente ---
export const createPaciente = async (req, res) => {
  try {
    const { nombres, apellidos, edad, genero, direccion, celular, email, password } = req.body;
    
    // Validar campos requeridos
    if (!nombres || !apellidos || !edad || !genero || !direccion || !celular || !email || !password) {
      return res.status(400).json({ 
        message: "Todos los campos son obligatorios. Para crear un paciente completo, use el registro de usuarios." 
      });
    }

    // Verificar si el email ya existe
    const existeEmail = await Usuario.findOne({ email });
    if (existeEmail) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Nota: Este endpoint debería crear usuarios completos, pero por ahora solo guardamos los datos básicos
    // Para crear un paciente completo, debería usar el endpoint de registro
    return res.status(400).json({ 
      message: "Para crear un paciente completo, use el formulario de registro. Este endpoint solo permite actualizar datos existentes." 
    });
  } catch (error) {
    res.status(400).json({ message: "Error al crear paciente", error: error.message });
  }
};

// --- Actualizar un paciente ---
export const updatePaciente = async (req, res) => {
  try {
    const { nombres, apellidos, edad, genero, direccion, celular } = req.body;
    
    // Solo permitir actualizar los campos del perfil
    const updateData = {};
    if (nombres !== undefined) updateData.nombres = nombres;
    if (apellidos !== undefined) updateData.apellidos = apellidos;
    if (edad !== undefined) updateData.edad = Number(edad);
    if (genero !== undefined) updateData.genero = genero;
    if (direccion !== undefined) updateData.direccion = direccion;
    if (celular !== undefined) updateData.celular = celular;

    const paciente = await Usuario.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, select: 'nombres apellidos edad genero direccion celular email' } // devuelve el actualizado con solo estos campos
    );
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }
    res.json(paciente);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar paciente", error: error.message });
  }
};

// --- Eliminar un paciente ---
export const deletePaciente = async (req, res) => {
  try {
    const paciente = await Usuario.findByIdAndDelete(req.params.id);
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado" });
    }
    res.json({ message: "Paciente eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar paciente", error: error.message });
  }
};