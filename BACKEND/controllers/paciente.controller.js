// controllers/paciente.controller.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcryptjs from "bcryptjs";
import Usuario from "../models/Usuario.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const getPacientes = async (req, res) => {
  try {
    // Obtener usuarios y seleccionar solo los campos necesarios
    const pacientes = await Usuario.find({}, {
      tipo_documento: 1,
      num_documento: 1,
      fecha_emision: 1,
      nombres: 1,
      apellidos: 1,
      edad: 1,
      genero: 1,
      direccion: 1,
      celular: 1,
      email: 1
    }).sort({ createdAt: -1 });
    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener pacientes", error });
  }
};

// Obtener estadísticas de pacientes para el dashboard
export const getEstadisticasPacientes = async (req, res) => {
  try {
    // Total de pacientes registrados
    const totalPacientes = await Usuario.countDocuments({});
    
    // Pacientes nuevos esta semana
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Primer día de la semana (domingo)
    inicioSemana.setHours(0, 0, 0, 0);
    
    const pacientesNuevosSemana = await Usuario.countDocuments({
      createdAt: {
        $gte: inicioSemana
      }
    });

    console.log("📊 Estadísticas de pacientes:", {
      totalPacientes,
      pacientesNuevosSemana
    });

    res.status(200).json({
      totalPacientes,
      pacientesNuevosSemana
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de pacientes:", error);
    res.status(500).json({ 
      error: "Error al obtener estadísticas de pacientes", 
      detalle: error.message 
    });
  }
};

// --- Obtener un paciente por ID ---
export const getPacienteById = async (req, res) => {
  try {
    const paciente = await Usuario.findById(req.params.id, {
      tipo_documento: 1,
      num_documento: 1,
      fecha_emision: 1,
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
    } = req.body;

    // Validar campos requeridos
    if (!rawTipo || !num_documento || !fecha_emision || !nombres || !apellidos || 
        !edad || !genero || !direccion || !celular || !email || !password) {
      return res.status(400).json({ 
        message: "Todos los campos son obligatorios." 
      });
    }

    // Validar tipo de documento
    const tipo = rawTipo.toLowerCase();
    if (!["dni", "pasaporte", "carnet-ext"].includes(tipo)) {
      return res.status(400).json({ message: "Tipo de documento inválido." });
    }

    // Validar número de documento
    if (
      !/^\d+$/.test(num_documento) ||
      ((tipo === "dni" || tipo === "pasaporte") && num_documento.length !== 8) ||
      (tipo === "carnet-ext" && num_documento.length !== 9)
    ) {
      return res.status(400).json({ message: "Número de documento inválido." });
    }

    // Validar fecha de emisión
    const fecha = new Date(fecha_emision);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (isNaN(fecha) || fecha >= hoy) {
      return res.status(400).json({ message: "Fecha de emisión inválida." });
    }

    // Validar edad
    const edadNum = Number(edad);
    if (Number.isNaN(edadNum) || edadNum < 0 || edadNum > 120) {
      return res.status(400).json({ message: "Edad inválida." });
    }

    // Verificar si el documento ya existe
    const existeDoc = await Usuario.findOne({ tipo_documento: tipo, num_documento });
    if (existeDoc) {
      return res.status(400).json({ message: "Ya existe un usuario con este número de documento." });
    }

    // Verificar si el email ya existe
    const existeEmail = await Usuario.findOne({ email: email.toLowerCase() });
    if (existeEmail) {
      return res.status(400).json({ message: "El email ya está registrado." });
    }

    // Hash de la contraseña
    const salt = await bcryptjs.genSalt(5);
    const hash = await bcryptjs.hash(password, salt);

    // Guardar en MongoDB
    const nuevoPaciente = await Usuario.create({
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
    });

    // Devolver el paciente creado (sin la contraseña)
    const pacienteCreado = {
      _id: nuevoPaciente._id,
      tipo_documento: nuevoPaciente.tipo_documento,
      num_documento: nuevoPaciente.num_documento,
      fecha_emision: nuevoPaciente.fecha_emision,
      nombres: nuevoPaciente.nombres,
      apellidos: nuevoPaciente.apellidos,
      edad: nuevoPaciente.edad,
      genero: nuevoPaciente.genero,
      direccion: nuevoPaciente.direccion,
      celular: nuevoPaciente.celular,
      email: nuevoPaciente.email,
    };

    res.status(201).json({
      message: "Paciente creado correctamente",
      paciente: pacienteCreado
    });
  } catch (error) {
    console.error("Error al crear paciente:", error);
    
    // Manejar errores de MongoDB (duplicados, etc.)
    if (error.code === 11000) {
      const campo = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `Ya existe un paciente con este ${campo === 'num_documento' ? 'número de documento' : 'email'}.` 
      });
    }
    
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

// Obtener pacientes nuevos por mes
export const getPacientesPorMes = async (req, res) => {
  try {
    // Obtener pacientes de los últimos 6 meses
    const hoy = new Date();
    const hace6Meses = new Date(hoy);
    hace6Meses.setMonth(hoy.getMonth() - 6);
    hace6Meses.setDate(1); // Primer día del mes
    hace6Meses.setHours(0, 0, 0, 0);
    
    // Agrupar pacientes por mes
    const pacientesPorMes = await Usuario.aggregate([
      {
        $match: {
          createdAt: { $gte: hace6Meses }
        }
      },
      {
        $group: {
          _id: {
            año: { $year: "$createdAt" },
            mes: { $month: "$createdAt" }
          },
          cantidad: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.año": 1, "_id.mes": 1 }
      }
    ]);
    
    // Crear un mapa con los meses de los últimos 6 meses
    const meses = [];
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const datos = [];
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setMonth(hoy.getMonth() - i);
      const año = fecha.getFullYear();
      const mes = fecha.getMonth() + 1;
      
      meses.push(`${nombresMeses[mes - 1]} ${año}`);
      
      // Buscar si hay datos para este mes
      const dato = pacientesPorMes.find(
        item => item._id.año === año && item._id.mes === mes
      );
      
      datos.push(dato ? dato.cantidad : 0);
    }
    
    const resultado = {
      labels: meses,
      datos: datos
    };
    
    console.log("📊 Pacientes nuevos por mes:", resultado);
    
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al obtener pacientes por mes:", error);
    res.status(500).json({ 
      error: "Error al obtener pacientes por mes", 
      detalle: error.message 
    });
  }
};