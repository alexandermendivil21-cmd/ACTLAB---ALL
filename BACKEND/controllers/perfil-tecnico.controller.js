// controllers/perfil-tecnico.controller.js
import Personal from "../models/Personal.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcryptjs from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener perfil del técnico por email
export const getPerfilTecnico = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        error: "El email es requerido" 
      });
    }

    const tecnico = await Personal.findOne({ 
      email: email.toLowerCase(),
      cargo: "tecnico"
    }, {
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
      estado: 1,
      imagen: 1
    });

    if (!tecnico) {
      return res.status(404).json({ 
        error: "Técnico no encontrado" 
      });
    }

    console.log("✅ Perfil técnico obtenido:", tecnico.email);
    res.status(200).json(tecnico);
  } catch (error) {
    console.error("Error al obtener perfil técnico:", error);
    res.status(500).json({ 
      error: "Error al obtener el perfil", 
      detalle: error.message 
    });
  }
};

// Actualizar perfil del técnico por email
export const updatePerfilTecnico = async (req, res) => {
  try {
    const { email } = req.query;
    const { 
      nombres, 
      apellidos, 
      edad, 
      genero, 
      direccion, 
      celular
    } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: "El email es requerido" 
      });
    }

    // Buscar el técnico actual
    const tecnicoActual = await Personal.findOne({ 
      email: email.toLowerCase(),
      cargo: "tecnico"
    });
    
    if (!tecnicoActual) {
      return res.status(404).json({ 
        error: "Técnico no encontrado" 
      });
    }

    // Preparar datos de actualización
    const updateData = {};
    
    if (nombres !== undefined) updateData.nombres = nombres.trim();
    if (apellidos !== undefined) updateData.apellidos = apellidos.trim();
    if (edad !== undefined) {
      const edadNum = Number(edad);
      if (isNaN(edadNum) || edadNum < 0 || edadNum > 120) {
        return res.status(400).json({ error: "Edad inválida" });
      }
      updateData.edad = edadNum;
    }
    if (genero !== undefined) {
      const generosValidos = ["masculino", "femenino", "otro", "no-especifica"];
      if (!generosValidos.includes(genero)) {
        return res.status(400).json({ error: "Género inválido" });
      }
      updateData.genero = genero;
    }
    if (direccion !== undefined) updateData.direccion = direccion.trim();
    if (celular !== undefined) updateData.celular = celular.trim();

    // Si hay una nueva imagen, procesarla
    if (req.file) {
      // Eliminar la imagen anterior si existe
      if (tecnicoActual.imagen) {
        const imagenAnteriorPath = path.join(__dirname, "..", "uploads", "profiles", path.basename(tecnicoActual.imagen));
        try {
          if (fs.existsSync(imagenAnteriorPath)) {
            fs.unlinkSync(imagenAnteriorPath);
          }
        } catch (err) {
          console.error("Error al eliminar imagen anterior:", err);
        }
      }
      
      // Guardar la ruta de la nueva imagen
      updateData.imagen = `/uploads/profiles/${req.file.filename}`;
    }

    const tecnico = await Personal.findOneAndUpdate(
      { email: email.toLowerCase(), cargo: "tecnico" },
      updateData,
      { 
        new: true, 
        select: 'tipo_documento num_documento fecha_emision nombres apellidos edad genero direccion celular email estado imagen' 
      }
    );

    if (!tecnico) {
      // Si falla la actualización y se subió un archivo, eliminarlo
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Error al eliminar archivo subido:", err);
        }
      }
      return res.status(404).json({ 
        error: "Técnico no encontrado" 
      });
    }

    console.log("✅ Perfil técnico actualizado:", tecnico.email);
    res.status(200).json({
      message: "Perfil actualizado correctamente",
      tecnico: tecnico
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
    console.error("Error al actualizar perfil técnico:", error);
    res.status(500).json({ 
      error: "Error al actualizar el perfil", 
      detalle: error.message 
    });
  }
};

