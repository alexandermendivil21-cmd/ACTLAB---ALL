// controllers/diagnostico.controller.js
import Diagnostico from "../models/Diagnostico.js";
import Usuario from "../models/Usuario.js";
import Personal from "../models/Personal.js";
import Cita from "../models/Cita.js";

export const getDiagnosticos = async (req, res) => {
  try {
    const { userEmail, userCargo } = req.query;
    
    let query = {};
    
    // Si el usuario es médico, solo mostrar sus propios diagnósticos
    if (userCargo === "medico" && userEmail) {
      // Buscar el médico por email para obtener su ID
      const medico = await Personal.findOne({ 
        email: userEmail.toLowerCase(), 
        cargo: "medico" 
      });
      
      if (medico) {
        query.idMedico = medico._id;
        console.log(`🔒 Filtrando diagnósticos para médico: ${medico.nombres} ${medico.apellidos}`);
      } else {
        // Si no se encuentra el médico, retornar array vacío
        console.warn(`⚠️ Médico no encontrado con email: ${userEmail}`);
        return res.status(200).json([]);
      }
    }
    // Si es admin o técnico, mostrar todos los diagnósticos (query vacío)
    
    const diagnosticos = await Diagnostico.find(query)
      .populate("idMedico", "nombres apellidos especialidad cargo")
      .populate("idCita", "fechaCita especialidad motivoCita estado")
      .sort({ fechaDiagnostico: -1 });
    
    console.log(`📋 Diagnósticos encontrados: ${diagnosticos.length} (Usuario: ${userCargo || 'admin'})`);
    res.status(200).json(diagnosticos);
  } catch (error) {
    console.error("Error al obtener diagnósticos:", error.message);
    res.status(500).json({ error: "Error al obtener diagnósticos", detalle: error.message });
  }
};

// --- Obtener un diagnóstico por ID ---
export const getDiagnosticoById = async (req, res) => {
  try {
    const { id } = req.params;
    const diagnostico = await Diagnostico.findById(id)
      .populate("idMedico", "nombres apellidos especialidad cargo")
      .populate("idCita", "fechaCita especialidad motivoCita estado");
    
    if (!diagnostico) {
      return res.status(404).json({ error: "Diagnóstico no encontrado" });
    }
    
    console.log("✅ Diagnóstico encontrado:", diagnostico._id);
    res.status(200).json(diagnostico);
  } catch (error) {
    console.error("Error al buscar diagnóstico:", error.message);
    res.status(500).json({ error: "Error al buscar diagnóstico", detalle: error.message });
  }
};

// --- Obtener diagnósticos por email del paciente ---
export const getDiagnosticosByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: "El email es requerido" });
    }
    
    const diagnosticos = await Diagnostico.find({ email: email.toLowerCase() })
      .populate("idMedico", "nombres apellidos especialidad cargo")
      .populate("idCita", "fechaCita especialidad motivoCita estado")
      .sort({ fechaDiagnostico: -1 });
    
    res.status(200).json(diagnosticos);
  } catch (error) {
    console.error("Error al obtener diagnósticos por email:", error.message);
    res.status(500).json({ error: "Error al obtener diagnósticos", detalle: error.message });
  }
};

// --- Crear un diagnóstico ---
export const createDiagnostico = async (req, res) => {
  try {
    console.log("📥 Datos recibidos del frontend:", req.body);
    
    const {
      email,
      idMedico,
      idCita,
      fechaDiagnostico,
      diagnostico,
      sintomas,
      observaciones,
      receta,
    } = req.body;

    // Validar campos requeridos
    if (!email || !idMedico || !diagnostico) {
      console.warn("Faltan datos requeridos");
      return res.status(400).json({ 
        error: "Email, médico y diagnóstico son obligatorios" 
      });
    }

    // Si no se proporciona fecha, usar la fecha/hora actual del servidor
    const fechaFinal = fechaDiagnostico ? new Date(fechaDiagnostico) : new Date();

    // Verificar que el paciente existe
    const paciente = await Usuario.findOne({ email: email.toLowerCase() });
    if (!paciente) {
      return res.status(404).json({ error: "El paciente no existe" });
    }

    // Verificar que el médico existe
    const medico = await Personal.findById(idMedico);
    if (!medico) {
      return res.status(404).json({ error: "El médico no existe" });
    }

    if (medico.cargo !== "medico") {
      return res.status(400).json({ error: "El personal seleccionado no es un médico" });
    }

    // Verificar que la cita existe si se proporciona
    let citaAsociada = null;
    if (idCita) {
      citaAsociada = await Cita.findById(idCita);
      if (!citaAsociada) {
        return res.status(404).json({ error: "La cita especificada no existe" });
      }
      // Verificar que la cita pertenece al paciente
      if (citaAsociada.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({ error: "La cita no pertenece al paciente especificado" });
      }
    }

    // Procesar receta si existe
    const tieneReceta = receta && receta.medicamentos && receta.medicamentos.length > 0;
    const medicamentos = tieneReceta ? receta.medicamentos : [];

    // Guardar en MongoDB
    const nuevoDiagnostico = await Diagnostico.create({
      email: email.toLowerCase(),
      idMedico,
      idCita: idCita || undefined,
      fechaDiagnostico: fechaFinal,
      diagnostico,
      sintomas: sintomas || "",
      observaciones: observaciones || "",
      receta: {
        medicamentos,
        tieneReceta,
      },
      estado: "completado",
    });

    const diagnosticoCreado = await Diagnostico.findById(nuevoDiagnostico._id)
      .populate("idMedico", "nombres apellidos especialidad cargo")
      .populate("idCita", "fechaCita especialidad motivoCita estado");

    console.log("✅ Diagnóstico guardado:", diagnosticoCreado._id);
    
    // Actualizar la cita asociada a "completada"
    try {
      // Si se proporcionó idCita, usar esa cita directamente
      if (citaAsociada) {
        await Cita.findByIdAndUpdate(citaAsociada._id, {
          estado: "completada"
        });
        console.log("✅ Cita actualizada a completada:", citaAsociada._id);
      } else {
        // Si no se proporcionó idCita, buscar automáticamente (comportamiento anterior)
        const fechaDiag = fechaFinal;
        const especialidadMedico = medico.especialidad && medico.especialidad !== "N/A" ? medico.especialidad : null;
        
        // Estrategia de búsqueda: buscar la cita más apropiada
        // 1. Primero buscar por email, estado, fecha del mismo día Y especialidad (si está disponible)
        // 2. Si no encuentra, buscar por email, estado y fecha del mismo día
        // 3. Si no encuentra, buscar la cita más reciente confirmada o pendiente del paciente
        
        const inicioDia = new Date(fechaDiag);
        inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date(fechaDiag);
        finDia.setHours(23, 59, 59, 999);
        
        let citaAuto = null;
        
        // Buscar cita en el mismo día con especialidad coincidente (si hay especialidad)
        if (especialidadMedico) {
          citaAuto = await Cita.findOne({
            email: email.toLowerCase(),
            estado: { $in: ["confirmada", "pendiente"] },
            especialidad: especialidadMedico,
            fechaCita: {
              $gte: inicioDia,
              $lte: finDia
            }
          }).sort({ fechaCita: -1 });
        }
        
        // Si no se encontró con especialidad, buscar en el mismo día sin especialidad
        if (!citaAuto) {
          citaAuto = await Cita.findOne({
            email: email.toLowerCase(),
            estado: { $in: ["confirmada", "pendiente"] },
            fechaCita: {
              $gte: inicioDia,
              $lte: finDia
            }
          }).sort({ fechaCita: -1 });
        }
        
        // Si aún no se encontró, buscar la cita más reciente confirmada o pendiente del paciente
        if (!citaAuto) {
          citaAuto = await Cita.findOne({
            email: email.toLowerCase(),
            estado: { $in: ["confirmada", "pendiente"] }
          }).sort({ fechaCita: -1 });
        }
        
        if (citaAuto) {
          // Actualizar la cita a estado "completada"
          await Cita.findByIdAndUpdate(citaAuto._id, {
            estado: "completada"
          });
          console.log("✅ Cita actualizada a completada (búsqueda automática):", citaAuto._id);
        } else {
          console.log("⚠️ No se encontró una cita asociada para el paciente:", email);
        }
      }
    } catch (errorCita) {
      // No fallar la creación del diagnóstico si hay error al actualizar la cita
      console.error("⚠️ Error al actualizar la cita asociada:", errorCita.message);
    }

    res.status(201).json({
      message: "Diagnóstico guardado correctamente",
      diagnostico: diagnosticoCreado
    });
  } catch (error) {
    console.error("💥 Error al guardar el diagnóstico:", error.message);
    res.status(500).json({ error: "Error al guardar el diagnóstico", detalle: error.message });
  }
};

// --- Actualizar un diagnóstico ---
export const updateDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnostico, sintomas, observaciones, receta, estado, idCita } = req.body;
    
    const updateData = {};
    if (diagnostico !== undefined) updateData.diagnostico = diagnostico;
    if (sintomas !== undefined) updateData.sintomas = sintomas;
    if (observaciones !== undefined) updateData.observaciones = observaciones;
    if (estado !== undefined) updateData.estado = estado;
    if (idCita !== undefined) {
      // Si se proporciona idCita, validar que existe
      if (idCita) {
        const cita = await Cita.findById(idCita);
        if (!cita) {
          return res.status(404).json({ error: "La cita especificada no existe" });
        }
        updateData.idCita = idCita;
      } else {
        // Si se envía vacío, eliminar la asociación
        updateData.idCita = undefined;
      }
    }
    
    if (receta !== undefined) {
      const tieneReceta = receta.medicamentos && receta.medicamentos.length > 0;
      updateData.receta = {
        medicamentos: receta.medicamentos || [],
        tieneReceta,
      };
    }

    const diagnosticoActualizado = await Diagnostico.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("idMedico", "nombres apellidos especialidad cargo")
      .populate("idCita", "fechaCita especialidad motivoCita estado");
    
    if (!diagnosticoActualizado) {
      return res.status(404).json({ error: "Diagnóstico no encontrado" });
    }

    console.log("✅ Diagnóstico actualizado:", diagnosticoActualizado._id);
    res.json({ message: "Diagnóstico actualizado", diagnostico: diagnosticoActualizado });
  } catch (error) {
    console.error("Error al actualizar diagnóstico:", error.message);
    res.status(500).json({ error: "Error al actualizar diagnóstico", detalle: error.message });
  }
};

// --- Eliminar un diagnóstico ---
export const deleteDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ Eliminando diagnóstico:", id);
    
    const diagnostico = await Diagnostico.findByIdAndDelete(id);
    if (!diagnostico) {
      return res.status(404).json({ error: "Diagnóstico no encontrado" });
    }

    console.log("✅ Diagnóstico eliminado:", {
      id: diagnostico._id,
      email: diagnostico.email
    });
    res.json({ message: "Diagnóstico eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar diagnóstico:", error.message);
    res.status(500).json({ error: "Error al eliminar diagnóstico", detalle: error.message });
  }
};

