// BACKEND/controllers/cita.controller.js
import Cita from "../models/Cita.js";
import Usuario from "../models/Usuario.js";

// Obtener todas las citas (para admin)
export const getCitas = async (req, res) => {
  try {
    const { email } = req.query;
    
    // Si se proporciona email, filtrar por email
    // Si no, devolver todas las citas (para admin)
    const query = email ? { email } : {};
    const citas = await Cita.find(query).sort({ fechaCita: 1 });
    
    // Obtener emails únicos de las citas
    const emailsUnicos = [...new Set(citas.map(c => c.email.toLowerCase()))];
    
    // Buscar usuarios por email
    const usuarios = await Usuario.find(
      { email: { $in: emailsUnicos } },
      { email: 1, nombres: 1, apellidos: 1 }
    );
    
    // Crear un mapa de email -> usuario para acceso rápido
    const mapaUsuarios = {};
    usuarios.forEach(usuario => {
      mapaUsuarios[usuario.email.toLowerCase()] = {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email
      };
    });
    
    // Agregar información del usuario a cada cita
    const citasConUsuario = citas.map(cita => {
      const usuario = mapaUsuarios[cita.email.toLowerCase()];
      return {
        ...cita.toObject(),
        paciente: usuario ? {
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          email: usuario.email
        } : null
      };
    });
    
    res.status(200).json(citasConUsuario);
  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ error: "Error al obtener las citas", detalle: error.message });
  }
};

// Obtener una cita por ID
export const getCitaById = async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findById(id);
    
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    
    res.status(200).json(cita);
  } catch (error) {
    console.error("Error al obtener la cita:", error);
    res.status(500).json({ error: "Error al obtener la cita", detalle: error.message });
  }
};

// Crear una nueva cita
export const createCita = async (req, res) => {
  try {
    const { email, especialidad, fechaCita, horario, motivoCita, estado } = req.body;

    if (!email || !especialidad || !fechaCita || !horario || !motivoCita) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ error: "El usuario no existe" });
    }

    const nuevaCita = new Cita({
      email,
      especialidad,
      fechaCita,
      horario,
      motivoCita,
      estado: estado || "pendiente",
    });

    await nuevaCita.save();
    res.status(201).json({
      message: "Cita creada correctamente",
      cita: nuevaCita,
    });
  } catch (error) {
    console.error("Error al crear la cita:", error);
    res.status(500).json({ error: "Error al crear la cita", detalle: error.message });
  }
};

// Actualizar una cita
export const updateCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, especialidad, fechaCita, horario, motivoCita, estado } = req.body;

    const cita = await Cita.findById(id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Verificar si hubo cambios reales (comparar valores actuales con nuevos)
    const huboCambios = 
      (email && cita.email !== email) ||
      (especialidad && cita.especialidad !== especialidad) ||
      (fechaCita && new Date(cita.fechaCita).getTime() !== new Date(fechaCita).getTime()) ||
      (horario && cita.horario !== horario) ||
      (motivoCita && cita.motivoCita !== motivoCita) ||
      (estado && cita.estado !== estado);

    // Actualizar campos si se proporcionan
    if (email) cita.email = email;
    if (especialidad) cita.especialidad = especialidad;
    if (fechaCita) cita.fechaCita = fechaCita;
    if (horario) cita.horario = horario;
    if (motivoCita) cita.motivoCita = motivoCita;
    if (estado) {
      cita.estado = estado;
      // Si se cancela desde admin, marcar canceladaPor
      if (estado === "cancelada" && !cita.canceladaPor) {
        cita.canceladaPor = "admin";
      }
    }

    // Si hubo cambios, marcar que fue modificada por el admin
    if (huboCambios) {
      cita.modificadaPor = "admin";
    }

    await cita.save();
    res.status(200).json({
      message: "Cita actualizada correctamente",
      cita: cita,
    });
  } catch (error) {
    console.error("Error al actualizar la cita:", error);
    res.status(500).json({ error: "Error al actualizar la cita", detalle: error.message });
  }
};

// Eliminar una cita
export const deleteCita = async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findByIdAndDelete(id);
    
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    
    res.status(200).json({ message: "Cita eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la cita:", error);
    res.status(500).json({ error: "Error al eliminar la cita", detalle: error.message });
  }
};

// Contar citas por estado y citas cambiadas
export const contarCitasPorEstado = async (req, res) => {
  try {
    // Contar citas por cada estado
    const citasConfirmadas = await Cita.countDocuments({ estado: "confirmada" });
    
    // Contar solo citas canceladas por el paciente
    const citasCanceladas = await Cita.countDocuments({ 
      estado: "cancelada",
      canceladaPor: "paciente"
    });
    
    const citasPendientes = await Cita.countDocuments({ estado: "pendiente" });
    
    // Contar solo citas modificadas por el paciente
    const citasCambiadas = await Cita.countDocuments({ 
      modificadaPor: "paciente"
    });

    // Log para debugging
    console.log("📊 Estadísticas de citas:", {
      citasConfirmadas,
      citasCanceladas,
      citasPendientes,
      citasCambiadas
    });

    // Verificar todas las citas canceladas para debugging
    const todasCanceladas = await Cita.find({ estado: "cancelada" }).select("canceladaPor estado");
    console.log("🔍 Todas las citas canceladas:", todasCanceladas.map(c => ({
      id: c._id,
      estado: c.estado,
      canceladaPor: c.canceladaPor
    })));

    res.status(200).json({
      citasConfirmadas,
      citasCanceladas,
      citasPendientes,
      citasCambiadas
    });
  } catch (error) {
    console.error("Error al contar citas por estado:", error);
    res.status(500).json({ 
      error: "Error al contar citas por estado", 
      detalle: error.message 
    });
  }
};

// Obtener estadísticas generales de citas para el dashboard
export const getEstadisticasCitas = async (req, res) => {
  try {
    // Total de citas reservadas (todas las citas)
    const totalCitas = await Cita.countDocuments({});
    
    // Citas del día actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    
    const citasDelDia = await Cita.countDocuments({
      fechaCita: {
        $gte: hoy,
        $lt: manana
      }
    });
    
    // Citas nuevas hoy (basadas en fechaRegistro)
    const citasNuevasHoy = await Cita.countDocuments({
      fechaRegistro: {
        $gte: hoy,
        $lt: manana
      }
    });

    console.log("📊 Estadísticas generales de citas:", {
      totalCitas,
      citasDelDia,
      citasNuevasHoy
    });

    res.status(200).json({
      totalCitas,
      citasDelDia,
      citasNuevasHoy
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de citas:", error);
    res.status(500).json({ 
      error: "Error al obtener estadísticas de citas", 
      detalle: error.message 
    });
  }
};

// Obtener citas de la semana actual (agrupadas por día)
export const getCitasSemana = async (req, res) => {
  try {
    // Calcular inicio y fin de la semana actual (lunes a domingo)
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, etc.
    
    // Calcular el lunes de la semana actual
    const lunes = new Date(hoy);
    const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    lunes.setDate(hoy.getDate() + diasHastaLunes);
    lunes.setHours(0, 0, 0, 0);
    
    // Calcular el domingo de la semana actual
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);
    
    // Obtener todas las citas de la semana
    const citasSemana = await Cita.find({
      fechaCita: {
        $gte: lunes,
        $lte: domingo
      }
    });
    
    // Inicializar contador para cada día de la semana
    const citasPorDia = {
      lunes: 0,
      martes: 0,
      miercoles: 0,
      jueves: 0,
      viernes: 0,
      sabado: 0,
      domingo: 0
    };
    
    // Contar citas por día
    citasSemana.forEach(cita => {
      const fechaCita = new Date(cita.fechaCita);
      const diaSemanaCita = fechaCita.getDay();
      
      switch (diaSemanaCita) {
        case 1: citasPorDia.lunes++; break;
        case 2: citasPorDia.martes++; break;
        case 3: citasPorDia.miercoles++; break;
        case 4: citasPorDia.jueves++; break;
        case 5: citasPorDia.viernes++; break;
        case 6: citasPorDia.sabado++; break;
        case 0: citasPorDia.domingo++; break;
      }
    });
    
    // Retornar en el orden correcto (lunes a domingo)
    const resultado = [
      citasPorDia.lunes,
      citasPorDia.martes,
      citasPorDia.miercoles,
      citasPorDia.jueves,
      citasPorDia.viernes,
      citasPorDia.sabado,
      citasPorDia.domingo
    ];
    
    console.log("📊 Citas de la semana:", resultado);
    
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al obtener citas de la semana:", error);
    res.status(500).json({ 
      error: "Error al obtener citas de la semana", 
      detalle: error.message 
    });
  }
};

