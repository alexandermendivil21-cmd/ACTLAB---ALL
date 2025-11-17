// controllers/perfil-medico.controller.js
import Personal from "../models/Personal.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcryptjs from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener perfil del médico por email
export const getPerfilMedico = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        error: "El email es requerido" 
      });
    }

    const medico = await Personal.findOne({ 
      email: email.toLowerCase(),
      cargo: "medico"
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
      especialidad: 1,
      estado: 1,
      imagen: 1,
      horariosDisponibilidad: 1
    });

    if (!medico) {
      return res.status(404).json({ 
        error: "Médico no encontrado" 
      });
    }

    console.log("✅ Perfil médico obtenido:", medico.email);
    res.status(200).json(medico);
  } catch (error) {
    console.error("Error al obtener perfil médico:", error);
    res.status(500).json({ 
      error: "Error al obtener el perfil", 
      detalle: error.message 
    });
  }
};

// Actualizar perfil del médico por email
export const updatePerfilMedico = async (req, res) => {
  try {
    const { email } = req.query;
    const { 
      nombres, 
      apellidos, 
      edad, 
      genero, 
      direccion, 
      celular,
      especialidad,
      horariosDisponibilidad 
    } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: "El email es requerido" 
      });
    }

    // Buscar el médico actual
    const medicoActual = await Personal.findOne({ 
      email: email.toLowerCase(),
      cargo: "medico"
    });
    
    if (!medicoActual) {
      return res.status(404).json({ 
        error: "Médico no encontrado" 
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
    if (especialidad !== undefined) updateData.especialidad = especialidad;

    // Validar y actualizar horarios de disponibilidad
    if (horariosDisponibilidad !== undefined) {
      if (Array.isArray(horariosDisponibilidad)) {
        // Validar cada horario
        const horariosValidos = horariosDisponibilidad.filter(horario => {
          if (!horario.diaSemana || !horario.horaInicio || !horario.horaFin) {
            return false;
          }
          const diasValidos = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
          if (!diasValidos.includes(horario.diaSemana)) {
            return false;
          }
          // Validar formato de hora (HH:mm)
          const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!horaRegex.test(horario.horaInicio) || !horaRegex.test(horario.horaFin)) {
            return false;
          }
          // Validar que horaFin sea mayor que horaInicio
          const [hInicio, mInicio] = horario.horaInicio.split(':').map(Number);
          const [hFin, mFin] = horario.horaFin.split(':').map(Number);
          const tiempoInicio = hInicio * 60 + mInicio;
          const tiempoFin = hFin * 60 + mFin;
          if (tiempoFin <= tiempoInicio) {
            return false;
          }
          return true;
        });
        
        updateData.horariosDisponibilidad = horariosValidos;
      } else {
        return res.status(400).json({ error: "Los horarios deben ser un array" });
      }
    }

    // Si hay una nueva imagen, procesarla
    if (req.file) {
      // Eliminar la imagen anterior si existe
      if (medicoActual.imagen) {
        const imagenAnteriorPath = path.join(__dirname, "..", "uploads", "profiles", path.basename(medicoActual.imagen));
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

    const medico = await Personal.findOneAndUpdate(
      { email: email.toLowerCase(), cargo: "medico" },
      updateData,
      { 
        new: true, 
        select: 'tipo_documento num_documento fecha_emision nombres apellidos edad genero direccion celular email especialidad estado imagen horariosDisponibilidad' 
      }
    );

    if (!medico) {
      // Si falla la actualización y se subió un archivo, eliminarlo
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error("Error al eliminar archivo subido:", err);
        }
      }
      return res.status(404).json({ 
        error: "Médico no encontrado" 
      });
    }

    console.log("✅ Perfil médico actualizado:", medico.email);
    res.status(200).json({
      message: "Perfil actualizado correctamente",
      medico: medico
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
    console.error("Error al actualizar perfil médico:", error);
    res.status(500).json({ 
      error: "Error al actualizar el perfil", 
      detalle: error.message 
    });
  }
};

