// BACKEND/controllers/resultado.controller.js
import Resultado from "../models/Resultado.js";
import Usuario from "../models/Usuario.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener todos los resultados (admin)
export const getResultados = async (req, res) => {
  try {
    const { email } = req.query;
    
    // Si se proporciona email, filtrar por email del paciente
    // Si no, devolver todos los resultados (para admin)
    const query = email ? { email } : {};
    const resultados = await Resultado.find(query)
      .sort({ fechaResultado: -1 });
    
    res.status(200).json(resultados);
  } catch (error) {
    console.error("Error al obtener resultados:", error);
    res.status(500).json({ 
      error: "Error al obtener los resultados", 
      detalle: error.message 
    });
  }
};

// Obtener un resultado por ID
export const getResultadoById = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Resultado.findById(id);
    
    if (!resultado) {
      return res.status(404).json({ error: "Resultado no encontrado" });
    }
    
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al obtener el resultado:", error);
    res.status(500).json({ 
      error: "Error al obtener el resultado", 
      detalle: error.message 
    });
  }
};

// Crear un nuevo resultado con PDF
export const createResultado = async (req, res) => {
  try {
    const { email, tipoExamen, fechaExamen, observaciones, estado } = req.body;

    if (!email || !tipoExamen || !fechaExamen) {
      return res.status(400).json({ 
        error: "Email, tipo de examen y fecha son obligatorios" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        error: "Debe subir un archivo PDF" 
      });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      // Eliminar el archivo subido si el usuario no existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "El usuario no existe" });
    }

    const nuevoResultado = new Resultado({
      email,
      tipoExamen,
      fechaExamen,
      fechaResultado: new Date(),
      archivoPDF: `/uploads/pdfs/${req.file.filename}`,
      nombreArchivo: req.file.originalname,
      observaciones: observaciones || "",
      estado: estado || "disponible",
    });

    await nuevoResultado.save();
    res.status(201).json({
      message: "Resultado creado correctamente",
      resultado: nuevoResultado,
    });
  } catch (error) {
    // Eliminar el archivo si hay error al guardar
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Error al crear el resultado:", error);
    res.status(500).json({ 
      error: "Error al crear el resultado", 
      detalle: error.message 
    });
  }
};

// Actualizar un resultado
export const updateResultado = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, tipoExamen, fechaExamen, observaciones, estado } = req.body;

    const resultado = await Resultado.findById(id);
    if (!resultado) {
      return res.status(404).json({ error: "Resultado no encontrado" });
    }

    // Si se sube un nuevo archivo, eliminar el anterior
    if (req.file) {
      const oldFilePath = path.join(__dirname, "..", resultado.archivoPDF);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      resultado.archivoPDF = `/uploads/pdfs/${req.file.filename}`;
      resultado.nombreArchivo = req.file.originalname;
    }

    // Actualizar campos si se proporcionan
    if (email) resultado.email = email;
    if (tipoExamen) resultado.tipoExamen = tipoExamen;
    if (fechaExamen) resultado.fechaExamen = fechaExamen;
    if (observaciones !== undefined) resultado.observaciones = observaciones;
    if (estado) resultado.estado = estado;

    await resultado.save();
    res.status(200).json({
      message: "Resultado actualizado correctamente",
      resultado: resultado,
    });
  } catch (error) {
    console.error("Error al actualizar el resultado:", error);
    res.status(500).json({ 
      error: "Error al actualizar el resultado", 
      detalle: error.message 
    });
  }
};

// Eliminar un resultado
export const deleteResultado = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Resultado.findById(id);
    
    if (!resultado) {
      return res.status(404).json({ error: "Resultado no encontrado" });
    }

    // Eliminar el archivo físico
    const filePath = path.join(__dirname, "..", resultado.archivoPDF);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Resultado.findByIdAndDelete(id);
    res.status(200).json({ message: "Resultado eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el resultado:", error);
    res.status(500).json({ 
      error: "Error al eliminar el resultado", 
      detalle: error.message 
    });
  }
};

// Servir el archivo PDF
export const getPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Resultado.findById(id);
    
    if (!resultado) {
      return res.status(404).json({ error: "Resultado no encontrado" });
    }

    const filePath = path.join(__dirname, "..", resultado.archivoPDF);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${resultado.nombreArchivo}"`
    );
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error al servir el PDF:", error);
    res.status(500).json({ 
      error: "Error al obtener el PDF", 
      detalle: error.message 
    });
  }
};

