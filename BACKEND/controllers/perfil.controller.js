// BACKEND/controllers/perfil.controller.js
import Usuario from "../models/Usuario.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener perfil por email
export const getPerfil = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        message: "El email es requerido" 
      });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() }, {
      nombres: 1,
      apellidos: 1,
      edad: 1,
      genero: 1,
      direccion: 1,
      celular: 1,
      email: 1,
      tipo_documento: 1,
      num_documento: 1,
      fecha_emision: 1,
      imagen: 1
    });

    if (!usuario) {
      return res.status(404).json({ 
        message: "Usuario no encontrado" 
      });
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ 
      message: "Error al obtener el perfil", 
      error: error.message 
    });
  }
};

// Actualizar perfil por email
export const updatePerfil = async (req, res) => {
  try {
    const { email } = req.query;
    const { nombres, apellidos, edad, genero, direccion, celular } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: "El email es requerido" 
      });
    }

    // Validar campos requeridos (imagen es opcional)
    if (!nombres || !apellidos || edad === undefined || !genero || !direccion || !celular) {
      return res.status(400).json({ 
        message: "Todos los campos son obligatorios" 
      });
    }

    // Validar edad
    const edadNum = Number(edad);
    if (isNaN(edadNum) || edadNum < 0 || edadNum > 120) {
      return res.status(400).json({ 
        message: "Edad inválida" 
      });
    }

    // Validar género
    const generosValidos = ["masculino", "femenino", "otro", "no-especifica"];
    if (!generosValidos.includes(genero)) {
      return res.status(400).json({ 
        message: "Género inválido" 
      });
    }

    // Buscar el usuario actual para obtener la imagen anterior
    const usuarioActual = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuarioActual) {
      return res.status(404).json({ 
        message: "Usuario no encontrado" 
      });
    }

    // Preparar datos de actualización
    const updateData = {
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      edad: edadNum,
      genero: genero,
      direccion: direccion.trim(),
      celular: celular.trim()
    };

    // Si hay una nueva imagen, procesarla
    if (req.file) {
      // Eliminar la imagen anterior si existe
      if (usuarioActual.imagen) {
        const imagenAnteriorPath = path.join(__dirname, "..", usuarioActual.imagen);
        try {
          if (fs.existsSync(imagenAnteriorPath)) {
            fs.unlinkSync(imagenAnteriorPath);
          }
        } catch (err) {
          console.error("Error al eliminar imagen anterior:", err);
          // No fallar si no se puede eliminar la imagen anterior
        }
      }
      
      // Guardar la ruta de la nueva imagen
      updateData.imagen = `/uploads/profiles/${req.file.filename}`;
    }

    const usuario = await Usuario.findOneAndUpdate(
      { email: email.toLowerCase() },
      updateData,
      { new: true, select: 'nombres apellidos edad genero direccion celular email tipo_documento num_documento imagen' }
    );

    if (!usuario) {
      // Si falla la actualización y se subió un archivo, eliminarlo
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Error al eliminar archivo subido:", err);
        }
      }
      return res.status(404).json({ 
        message: "Usuario no encontrado" 
      });
    }

    res.status(200).json({
      message: "Perfil actualizado correctamente",
      usuario: usuario
    });
  } catch (error) {
    // Si hay error y se subió un archivo, eliminarlo
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error al eliminar archivo subido:", err);
      }
    }
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ 
      message: "Error al actualizar el perfil", 
      error: error.message 
    });
  }
};

