// BACKEND/controllers/muestra.controller.js
import Muestra from "../models/Muestra.js";
import Cita from "../models/Cita.js";
import Usuario from "../models/Usuario.js";

// Obtener todas las muestras con información del paciente y la cita
export const getMuestras = async (req, res) => {
  try {
    const muestras = await Muestra.find({})
      .populate({
        path: "citaId",
        select: "fechaCita especialidad motivoCita",
      })
      .sort({ createdAt: -1 });

    // Obtener información de los pacientes
    const muestrasConPaciente = await Promise.all(
      muestras.map(async (muestra) => {
        const paciente = await Usuario.findOne(
          { email: muestra.email },
          { nombres: 1, apellidos: 1, email: 1, num_documento: 1 }
        );

        return {
          _id: muestra._id,
          nombrePaciente: paciente
            ? `${paciente.nombres} ${paciente.apellidos}`
            : "Paciente no encontrado",
          email: muestra.email,
          fechaRecoleccion: muestra.citaId?.fechaCita || muestra.createdAt,
          fechaRealizacionCita: muestra.citaId?.fechaCita || muestra.createdAt,
          tipoMuestra: muestra.tipoMuestra || "otros",
          estadoMuestra: muestra.estadoMuestra,
          tecnicoLaboratorio: muestra.tecnicoLaboratorio || "",
          especialidad: muestra.citaId?.especialidad || "N/A",
          dniPaciente: paciente?.num_documento || "N/A",
          observaciones: muestra.observaciones,
          createdAt: muestra.createdAt,
          updatedAt: muestra.updatedAt,
        };
      })
    );

    res.status(200).json(muestrasConPaciente);
  } catch (error) {
    console.error("Error al obtener muestras:", error);
    res.status(500).json({
      error: "Error al obtener las muestras",
      detalle: error.message,
    });
  }
};

// Obtener una muestra por ID
export const getMuestraById = async (req, res) => {
  try {
    const { id } = req.params;
    const muestra = await Muestra.findById(id).populate({
      path: "citaId",
      select: "fechaCita especialidad motivoCita",
    });

    if (!muestra) {
      return res.status(404).json({ error: "Muestra no encontrada" });
    }

    const paciente = await Usuario.findOne(
      { email: muestra.email },
      { nombres: 1, apellidos: 1, email: 1, num_documento: 1 }
    );

    const muestraConPaciente = {
      _id: muestra._id,
      nombrePaciente: paciente
        ? `${paciente.nombres} ${paciente.apellidos}`
        : "Paciente no encontrado",
      email: muestra.email,
      fechaRecoleccion: muestra.citaId?.fechaCita || muestra.createdAt,
      fechaRealizacionCita: muestra.citaId?.fechaCita || muestra.createdAt,
      tipoMuestra: muestra.tipoMuestra || "otros",
      estadoMuestra: muestra.estadoMuestra,
      tecnicoLaboratorio: muestra.tecnicoLaboratorio || "",
      especialidad: muestra.citaId?.especialidad || "N/A",
      dniPaciente: paciente?.num_documento || "N/A",
      observaciones: muestra.observaciones,
      citaId: muestra.citaId?._id,
      createdAt: muestra.createdAt,
      updatedAt: muestra.updatedAt,
    };

    res.status(200).json(muestraConPaciente);
  } catch (error) {
    console.error("Error al obtener la muestra:", error);
    res.status(500).json({
      error: "Error al obtener la muestra",
      detalle: error.message,
    });
  }
};

// Crear una nueva muestra
export const createMuestra = async (req, res) => {
  try {
    const { citaId, email, tipoMuestra, estadoMuestra, tecnicoLaboratorio, observaciones } = req.body;

    if (!citaId || !email || !tipoMuestra) {
      return res.status(400).json({
        error: "CitaId, email y tipoMuestra son obligatorios",
      });
    }

    // Verificar que la cita existe
    const cita = await Cita.findById(citaId);
    if (!cita) {
      return res.status(404).json({ error: "La cita no existe" });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ error: "El usuario no existe" });
    }

    // Validar tipoMuestra
    if (!["sangre", "orina", "heces", "otros"].includes(tipoMuestra)) {
      return res.status(400).json({
        error: "Tipo de muestra inválido. Debe ser: sangre, orina, heces u otros",
      });
    }

    // Validar estadoMuestra si se proporciona
    if (estadoMuestra && !["pendiente", "en análisis", "completado"].includes(estadoMuestra)) {
      return res.status(400).json({
        error: "Estado inválido. Debe ser: pendiente, en análisis o completado",
      });
    }

    const nuevaMuestra = new Muestra({
      citaId,
      email,
      tipoMuestra,
      estadoMuestra: estadoMuestra || "pendiente",
      tecnicoLaboratorio: tecnicoLaboratorio || "",
      observaciones: observaciones || "",
    });

    await nuevaMuestra.save();

    // Obtener información completa de la muestra creada
    const muestraCompleta = await Muestra.findById(nuevaMuestra._id)
      .populate({
        path: "citaId",
        select: "fechaCita especialidad motivoCita",
      });

    const paciente = await Usuario.findOne(
      { email: muestraCompleta.email },
      { nombres: 1, apellidos: 1, email: 1, num_documento: 1 }
    );

    const muestraConDatos = {
      _id: muestraCompleta._id,
      nombrePaciente: paciente
        ? `${paciente.nombres} ${paciente.apellidos}`
        : "Paciente no encontrado",
      email: muestraCompleta.email,
      fechaRecoleccion: muestraCompleta.citaId?.fechaCita || muestraCompleta.createdAt,
      fechaRealizacionCita: muestraCompleta.citaId?.fechaCita || muestraCompleta.createdAt,
      tipoMuestra: muestraCompleta.tipoMuestra,
      estadoMuestra: muestraCompleta.estadoMuestra,
      tecnicoLaboratorio: muestraCompleta.tecnicoLaboratorio || "",
      especialidad: muestraCompleta.citaId?.especialidad || "N/A",
      dniPaciente: paciente?.num_documento || "N/A",
      observaciones: muestraCompleta.observaciones,
      createdAt: muestraCompleta.createdAt,
      updatedAt: muestraCompleta.updatedAt,
    };

    res.status(201).json({
      message: "Muestra creada correctamente",
      muestra: muestraConDatos,
    });
  } catch (error) {
    console.error("Error al crear la muestra:", error);
    res.status(500).json({
      error: "Error al crear la muestra",
      detalle: error.message,
    });
  }
};

// Actualizar el estado de una muestra (solo técnicos)
export const updateMuestraEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estadoMuestra, observaciones, userCargo } = req.body;

    // Verificar que el usuario es técnico (verificación desde el frontend)
    if (userCargo && userCargo !== "tecnico") {
      return res.status(403).json({
        error: "No tienes permiso para actualizar el estado de las muestras. Solo técnicos de laboratorio pueden hacerlo.",
      });
    }

    const muestra = await Muestra.findById(id);
    if (!muestra) {
      return res.status(404).json({ error: "Muestra no encontrada" });
    }

    // Validar estado
    if (estadoMuestra && !["pendiente", "en análisis", "completado"].includes(estadoMuestra)) {
      return res.status(400).json({
        error: "Estado inválido. Debe ser 'pendiente', 'en análisis' o 'completado'",
      });
    }

    // Actualizar campos
    if (estadoMuestra) muestra.estadoMuestra = estadoMuestra;
    if (observaciones !== undefined) muestra.observaciones = observaciones;

    await muestra.save();

    // Obtener información actualizada con paciente y cita
    const muestraActualizada = await Muestra.findById(id)
      .populate({
        path: "citaId",
        select: "fechaCita especialidad motivoCita",
      });

    const paciente = await Usuario.findOne(
      { email: muestraActualizada.email },
      { nombres: 1, apellidos: 1, email: 1, num_documento: 1 }
    );

    const muestraConPaciente = {
      _id: muestraActualizada._id,
      nombrePaciente: paciente
        ? `${paciente.nombres} ${paciente.apellidos}`
        : "Paciente no encontrado",
      email: muestraActualizada.email,
      fechaRecoleccion: muestraActualizada.citaId?.fechaCita || muestraActualizada.createdAt,
      fechaRealizacionCita: muestraActualizada.citaId?.fechaCita || muestraActualizada.createdAt,
      tipoMuestra: muestraActualizada.tipoMuestra || "otros",
      estadoMuestra: muestraActualizada.estadoMuestra,
      tecnicoLaboratorio: muestraActualizada.tecnicoLaboratorio || "",
      especialidad: muestraActualizada.citaId?.especialidad || "N/A",
      dniPaciente: paciente?.num_documento || "N/A",
      observaciones: muestraActualizada.observaciones,
      createdAt: muestraActualizada.createdAt,
      updatedAt: muestraActualizada.updatedAt,
    };

    res.status(200).json({
      message: "Estado de la muestra actualizado correctamente",
      muestra: muestraConPaciente,
    });
  } catch (error) {
    console.error("Error al actualizar el estado de la muestra:", error);
    res.status(500).json({
      error: "Error al actualizar el estado de la muestra",
      detalle: error.message,
    });
  }
};

// Eliminar una muestra
export const deleteMuestra = async (req, res) => {
  try {
    const { id } = req.params;
    const muestra = await Muestra.findByIdAndDelete(id);

    if (!muestra) {
      return res.status(404).json({ error: "Muestra no encontrada" });
    }

    res.status(200).json({ message: "Muestra eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la muestra:", error);
    res.status(500).json({
      error: "Error al eliminar la muestra",
      detalle: error.message,
    });
  }
};

