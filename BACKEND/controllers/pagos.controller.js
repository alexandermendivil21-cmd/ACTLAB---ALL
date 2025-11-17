import Pago from "../models/Pago.js";
import Cita from "../models/Cita.js";
import Usuario from "../models/Usuario.js";
import { crearNotificacion } from "./notificacion.controller.js";

export const crearPago = async (req, res) => {
  try {
    const { email, citaId, monto, metodo } = req.body;
    
    console.log('Datos recibidos para crear pago:', { email, citaId, monto, metodo });
    
    // Validar datos requeridos
    if (!email) {
      return res.status(400).json({ message: "El email es requerido" });
    }
    if (!citaId) {
      return res.status(400).json({ message: "El ID de la cita es requerido" });
    }
    if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
      return res.status(400).json({ message: "El monto debe ser un número válido mayor a 0" });
    }

    // Validar método de pago
    const metodosValidos = ['tarjeta', 'yape', 'plin', 'efectivo'];
    const metodoValidado = metodo && metodosValidos.includes(metodo.toLowerCase()) 
      ? metodo.toLowerCase() 
      : 'tarjeta';

    // Buscar la cita
    const cita = await Cita.findById(citaId);
    if (!cita) {
      console.error('Cita no encontrada con ID:', citaId);
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    console.log('Cita encontrada:', {
      _id: cita._id,
      email: cita.email,
      especialidad: cita.especialidad,
      estado: cita.estado
    });

    // Verificar si ya existe un pago para esta cita
    const pagoExistente = await Pago.findOne({ citaId });
    if (pagoExistente) {
      console.log('Ya existe un pago para esta cita:', {
        pagoId: pagoExistente._id,
        citaId: pagoExistente.citaId,
        monto: pagoExistente.monto,
        metodo: pagoExistente.metodo,
        estado: pagoExistente.estado
      });
      return res.status(400).json({ 
        message: "Esta cita ya tiene un pago registrado",
        pagoExistente: {
          _id: pagoExistente._id,
          monto: pagoExistente.monto,
          metodo: pagoExistente.metodo,
          estado: pagoExistente.estado,
          createdAt: pagoExistente.createdAt
        }
      });
    }

    // Crear el pago
    const pago = new Pago({ 
      email: email.toLowerCase().trim(), 
      citaId: citaId, 
      monto: parseFloat(monto), 
      metodo: metodoValidado, 
      estado: "pagado" 
    });
    
    console.log('Pago a crear:', {
      email: pago.email,
      citaId: pago.citaId,
      monto: pago.monto,
      metodo: pago.metodo,
      estado: pago.estado
    });
    
    await pago.save();
    console.log('Pago guardado exitosamente:', pago._id);

    // Actualizar estado de la cita a confirmada
    cita.estado = "confirmada";
    await cita.save();
    console.log('Estado de la cita actualizado a confirmada');

    // Crear notificación con información detallada
    try {
      const fechaCitaFormateada = new Date(cita.fechaCita).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const metodoFormateado = metodoValidado ? metodoValidado.charAt(0).toUpperCase() + metodoValidado.slice(1) : 'Tarjeta';

      await crearNotificacion(
        "pago_realizado",
        `Pago recibido: ${email} pagó S/ ${monto.toFixed(2)} por cita de ${cita.especialidad} (${fechaCitaFormateada}) - Método: ${metodoFormateado}`,
        { 
          pagoId: pago._id, 
          email, 
          citaId,
          monto,
          metodo: metodoValidado,
          especialidad: cita.especialidad,
          fechaCita: cita.fechaCita,
          horario: cita.horario
        }
      );
      console.log('Notificación creada exitosamente');
    } catch (notifError) {
      console.error('Error al crear notificación (no crítico):', notifError.message);
      // No fallar el pago si la notificación falla
    }

    // Devolver el pago poblado con la cita
    const pagoPoblado = await Pago.findById(pago._id)
      .populate('citaId', 'especialidad fechaCita horario estado')
      .lean();

    res.status(201).json({ 
      message: "Pago registrado exitosamente", 
      pago: pagoPoblado 
    });
  } catch (e) {
    console.error("Error crearPago:", e);
    console.error("Stack trace:", e.stack);
    res.status(500).json({ 
      message: "Error al registrar pago", 
      error: e.message,
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
};

export const listarPagosPaciente = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email es requerido" });
    }
    
    const filtro = { email: email.toLowerCase().trim() };
    console.log('Buscando pagos con filtro:', filtro);
    
    const pagos = await Pago.find(filtro)
      .populate({
        path: 'citaId',
        select: 'especialidad fechaCita horario estado',
        model: 'Cita'
      })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`Encontrados ${pagos.length} pagos para ${email}`);
    
    // Asegurar que los datos estén correctamente estructurados
    const pagosFormateados = [];
    
    for (const pago of pagos) {
      let citaInfo = null;
      
      // Procesar citaId
      if (pago.citaId) {
        if (typeof pago.citaId === 'object' && pago.citaId !== null) {
          // Cita está poblada (objeto con datos)
          citaInfo = {
            _id: pago.citaId._id ? pago.citaId._id.toString() : null,
            especialidad: pago.citaId.especialidad || null,
            fechaCita: pago.citaId.fechaCita || null,
            horario: pago.citaId.horario || null,
            estado: pago.citaId.estado || null
          };
        } else if (typeof pago.citaId === 'string') {
          // Solo tenemos el ID, cargar la cita
          try {
            const cita = await Cita.findById(pago.citaId).lean();
            if (cita) {
              citaInfo = {
                _id: cita._id.toString(),
                especialidad: cita.especialidad || null,
                fechaCita: cita.fechaCita || null,
                horario: cita.horario || null,
                estado: cita.estado || null
              };
            } else {
              citaInfo = { _id: pago.citaId };
            }
          } catch (err) {
            console.error('Error al cargar cita:', err.message);
            citaInfo = { _id: pago.citaId };
          }
        }
      }
      
      // Normalizar monto
      let monto = 0;
      if (typeof pago.monto === 'number') {
        monto = pago.monto;
      } else if (pago.monto) {
        monto = parseFloat(pago.monto);
        if (isNaN(monto)) monto = 0;
      }
      
      // Normalizar método
      let metodo = 'tarjeta';
      if (pago.metodo) {
        const metodoLower = String(pago.metodo).toLowerCase().trim();
        if (['tarjeta', 'yape', 'plin', 'efectivo'].includes(metodoLower)) {
          metodo = metodoLower;
        }
      }
      
      // Normalizar estado
      let estado = 'pagado';
      if (pago.estado) {
        const estadoLower = String(pago.estado).toLowerCase().trim();
        if (['pagado', 'pendiente'].includes(estadoLower)) {
          estado = estadoLower;
        }
      }
      
      // Crear objeto de pago formateado
      const pagoFormateado = {
        _id: pago._id ? pago._id.toString() : null,
        email: pago.email || '',
        citaId: citaInfo,
        monto: monto,
        metodo: metodo,
        estado: estado,
        createdAt: pago.createdAt || new Date(),
        updatedAt: pago.updatedAt || new Date()
      };
      
      pagosFormateados.push(pagoFormateado);
    }
    
    console.log(`✅ Devolviendo ${pagosFormateados.length} pagos formateados para ${email}`);
    if (pagosFormateados.length > 0) {
      console.log('Ejemplo de pago formateado:', {
        _id: pagosFormateados[0]._id,
        email: pagosFormateados[0].email,
        tieneCita: !!pagosFormateados[0].citaId,
        especialidad: pagosFormateados[0].citaId?.especialidad || 'N/A',
        monto: pagosFormateados[0].monto,
        metodo: pagosFormateados[0].metodo,
        estado: pagosFormateados[0].estado
      });
    }
    
    res.json(pagosFormateados);
  } catch (e) {
    console.error("Error listarPagosPaciente:", e);
    console.error("Stack trace:", e.stack);
    res.status(500).json({ 
      message: "Error al listar pagos", 
      error: e.message 
    });
  }
};

export const listarPagosAdmin = async (req, res) => {
  try {
    const pagos = await Pago.find()
      .populate('citaId', 'especialidad fechaCita horario')
      .sort({ createdAt: -1 });
    
    // Obtener emails únicos de los pagos
    const emailsUnicos = [...new Set(pagos.map(p => p.email.toLowerCase()))];
    
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
    
    // Agregar información del usuario a cada pago
    const pagosConUsuario = pagos.map(pago => {
      const usuario = mapaUsuarios[pago.email.toLowerCase()];
      return {
        ...pago.toObject(),
        usuario: usuario || null
      };
    });
    
    res.json(pagosConUsuario);
  } catch (e) {
    console.error("Error listarPagosAdmin:", e.message);
    res.status(500).json({ message: "Error al listar pagos", error: e.message });
  }
};

export const actualizarMetodoPago = async (req, res) => {
  try {
    const { pagoId } = req.params;
    const { metodo } = req.body;

    if (!metodo) {
      return res.status(400).json({ message: "El método de pago es requerido" });
    }

    // Validar método de pago
    const metodosValidos = ['tarjeta', 'yape', 'plin', 'efectivo'];
    const metodoValidado = metodo && metodosValidos.includes(metodo.toLowerCase()) 
      ? metodo.toLowerCase() 
      : null;

    if (!metodoValidado) {
      return res.status(400).json({ message: "Método de pago inválido. Debe ser: tarjeta, yape, plin o efectivo" });
    }

    const pago = await Pago.findById(pagoId);
    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    // Actualizar el método de pago
    pago.metodo = metodoValidado;
    await pago.save();

    res.json({ message: "Método de pago actualizado exitosamente", pago });
  } catch (e) {
    console.error("Error actualizarMetodoPago:", e.message);
    res.status(500).json({ message: "Error al actualizar método de pago", error: e.message });
  }
};

// Obtener estadísticas de pagos para el dashboard
export const getEstadisticasPagos = async (req, res) => {
  try {
    // Total de pagos recibidos (solo pagos con estado "pagado")
    const totalPagos = await Pago.countDocuments({ estado: "pagado" });
    
    // Monto total recibido (suma de todos los pagos con estado "pagado")
    const resultadoAgregacion = await Pago.aggregate([
      { $match: { estado: "pagado" } },
      { $group: { _id: null, montoTotal: { $sum: "$monto" } } }
    ]);
    
    const montoTotal = resultadoAgregacion.length > 0 ? resultadoAgregacion[0].montoTotal : 0;
    
    // Pagos recibidos hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    
    const pagosHoy = await Pago.countDocuments({
      estado: "pagado",
      createdAt: {
        $gte: hoy,
        $lt: manana
      }
    });
    
    // Monto recibido hoy
    const resultadoAgregacionHoy = await Pago.aggregate([
      { 
        $match: { 
          estado: "pagado",
          createdAt: {
            $gte: hoy,
            $lt: manana
          }
        } 
      },
      { $group: { _id: null, montoTotal: { $sum: "$monto" } } }
    ]);
    
    const montoHoy = resultadoAgregacionHoy.length > 0 ? resultadoAgregacionHoy[0].montoTotal : 0;

    console.log("📊 Estadísticas de pagos:", {
      totalPagos,
      montoTotal,
      pagosHoy,
      montoHoy
    });

    res.status(200).json({
      totalPagos,
      montoTotal: montoTotal.toFixed(2),
      pagosHoy,
      montoHoy: montoHoy.toFixed(2)
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de pagos:", error);
    res.status(500).json({ 
      error: "Error al obtener estadísticas de pagos", 
      detalle: error.message 
    });
  }
};


