// controllers/personal.controller.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcryptjs from "bcryptjs";
import Personal from "../models/Personal.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const getPersonal = async (req, res) => {
  try {
    const personal = await Personal.find({}, {
      tipo_documento: 1,
      num_documento: 1,
      fecha_emision: 1,
      nombres: 1,
      apellidos: 1,
      edad: 1,
      genero: 1,
      direccion: 1,
      celular: 1,
      email: 1,
      cargo: 1,
      especialidad: 1,
      estado: 1,
      imagen: 1,
      horariosDisponibilidad: 1,
    }).sort({ createdAt: -1 });
    console.log("Personal encontrado:", personal.length);
    res.status(200).json(personal);
  } catch (error) {
    console.error("Error al obtener personal:", error.message);
    res.status(500).json({ error: "Error al obtener personal", detalle: error.message });
  }
};

// --- Obtener un miembro del personal por ID ---
export const getPersonalById = async (req, res) => {
  try {
    const { id } = req.params;
    const { paciente } = req.query; // Si viene ?paciente=true, no devolver email ni celular
    
    const personal = await Personal.findById(id, {
      tipo_documento: 1,
      num_documento: 1,
      fecha_emision: 1,
      nombres: 1,
      apellidos: 1,
      edad: 1,
      genero: 1,
      direccion: 1,
      celular: 1,
      email: 1,
      cargo: 1,
      especialidad: 1,
      estado: 1,
      imagen: 1,
      horariosDisponibilidad: 1,
    });
    if (!personal) {
      return res.status(404).json({ error: "Personal no encontrado" });
    }
    
    // Si la consulta viene del dashboard del paciente, no devolver email, celular ni dirección
    let personalData = personal.toObject();
    if (paciente === "true" || paciente === true) {
      delete personalData.email;
      delete personalData.celular;
      delete personalData.direccion;
    }
    
    console.log("✅ Personal encontrado:", personal._id);
    res.status(200).json(personalData);
  } catch (error) {
    console.error("Error al buscar personal:", error.message);
    res.status(500).json({ error: "Error al buscar personal", detalle: error.message });
  }
};

// --- Crear un miembro del personal ---
export const createPersonal = async (req, res) => {
  try {
    console.log("📥 Datos recibidos del frontend:", req.body);
    
    const {
      tipo_documento: rawTipo,
      num_documento,
      fecha_emision,
      nombres,
      apellidos,
      edad,
      genero,
      direccion,
      celular,
      email,
      password,
      cargo,
      especialidad,
      estado,
    } = req.body;

    // Validar campos requeridos
    if (!rawTipo || !num_documento || !fecha_emision || !nombres || !apellidos || 
        !edad || !genero || !direccion || !celular || !email || !password || !cargo) {
      console.warn("Faltan datos requeridos");
      return res.status(400).json({ 
        error: "Todos los campos son obligatorios" 
      });
    }

    // Validar tipo de documento
    const tipo = rawTipo.toLowerCase();
    if (!["dni", "pasaporte", "carnet-ext"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo de documento inválido" });
    }

    // Validar número de documento
    if (
      !/^\d+$/.test(num_documento) ||
      ((tipo === "dni" || tipo === "pasaporte") && num_documento.length !== 8) ||
      (tipo === "carnet-ext" && num_documento.length !== 9)
    ) {
      return res.status(400).json({ error: "Número de documento inválido" });
    }

    // Validar fecha de emisión
    const fecha = new Date(fecha_emision);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (isNaN(fecha) || fecha >= hoy) {
      return res.status(400).json({ error: "Fecha de emisión inválida" });
    }

    // Validar edad
    const edadNum = Number(edad);
    if (Number.isNaN(edadNum) || edadNum < 0 || edadNum > 120) {
      return res.status(400).json({ error: "Edad inválida" });
    }

    // Validar cargo
    if (!["medico", "tecnico", "recepcionista"].includes(cargo)) {
      return res.status(400).json({ error: "Cargo inválido" });
    }

    // Verificar si el documento ya existe
    const existeDoc = await Personal.findOne({ tipo_documento: tipo, num_documento });
    if (existeDoc) {
      return res.status(400).json({ error: "Ya existe un miembro del personal con este número de documento" });
    }

    // Verificar si el email ya existe
    const existeEmail = await Personal.findOne({ email: email.toLowerCase() });
    if (existeEmail) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Hash de la contraseña
    const salt = await bcryptjs.genSalt(5);
    const hash = await bcryptjs.hash(password, salt);

    // Guardar en MongoDB
    const nuevoPersonal = await Personal.create({
      tipo_documento: tipo,
      num_documento,
      fecha_emision: fecha,
      nombres,
      apellidos,
      edad: edadNum,
      genero,
      direccion,
      celular,
      email: email.toLowerCase(),
      password: hash,
      cargo,
      especialidad: especialidad || "N/A",
      estado: estado || "activo",
    });

    // Devolver el personal creado (sin la contraseña)
    const personalCreado = {
      _id: nuevoPersonal._id,
      tipo_documento: nuevoPersonal.tipo_documento,
      num_documento: nuevoPersonal.num_documento,
      fecha_emision: nuevoPersonal.fecha_emision,
      nombres: nuevoPersonal.nombres,
      apellidos: nuevoPersonal.apellidos,
      edad: nuevoPersonal.edad,
      genero: nuevoPersonal.genero,
      direccion: nuevoPersonal.direccion,
      celular: nuevoPersonal.celular,
      email: nuevoPersonal.email,
      cargo: nuevoPersonal.cargo,
      especialidad: nuevoPersonal.especialidad,
      estado: nuevoPersonal.estado,
    };

    console.log("✅ Personal guardado:", personalCreado._id);
    res.status(201).json({
      message: "Personal guardado correctamente",
      personal: personalCreado
    });
  } catch (error) {
    console.error("💥 Error al guardar el personal:", error.message);
    
    // Manejar errores de MongoDB (duplicados, etc.)
    if (error.code === 11000) {
      const campo = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: `Ya existe un miembro del personal con este ${campo === 'num_documento' ? 'número de documento' : 'email'}` 
      });
    }
    
    res.status(500).json({ error: "Error al guardar el personal", detalle: error.message });
  }
};

// --- Actualizar un miembro del personal ---
export const updatePersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, edad, genero, direccion, celular, cargo, especialidad, estado } = req.body;
    
    const updateData = {};
    if (nombres !== undefined) updateData.nombres = nombres;
    if (apellidos !== undefined) updateData.apellidos = apellidos;
    if (edad !== undefined) updateData.edad = Number(edad);
    if (genero !== undefined) updateData.genero = genero;
    if (direccion !== undefined) updateData.direccion = direccion;
    if (celular !== undefined) updateData.celular = celular;
    if (cargo !== undefined) updateData.cargo = cargo;
    if (especialidad !== undefined) updateData.especialidad = especialidad;
    if (estado !== undefined) updateData.estado = estado;

    const personal = await Personal.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: 'tipo_documento num_documento fecha_emision nombres apellidos edad genero direccion celular email cargo especialidad estado' }
    );
    if (!personal) {
      return res.status(404).json({ error: "Personal no encontrado" });
    }

    console.log("✅ Personal actualizado:", personal._id);
    res.json({ message: "Personal actualizado", personal });
  } catch (error) {
    console.error("Error al actualizar personal:", error.message);
    res.status(500).json({ error: "Error al actualizar personal", detalle: error.message });
  }
};

// --- Eliminar un miembro del personal ---
export const deletePersonal = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ Eliminando personal:", id);
    
    const personal = await Personal.findByIdAndDelete(id);
    if (!personal) {
      return res.status(404).json({ error: "Personal no encontrado" });
    }

    console.log("✅ Personal eliminado:", {
      id: personal._id,
      email: personal.email,
      nombres: personal.nombres
    });
    res.json({ message: "Personal eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar personal:", error.message);
    res.status(500).json({ error: "Error al eliminar personal", detalle: error.message });
  }
};

