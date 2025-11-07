import Notificacion from "../models/Notificacion.js";

export const crearNotificacion = async (tipo, mensaje, datos = {}) => {
  try {
    const n = new Notificacion({ tipo, mensaje, datos });
    await n.save();
    return n;
  } catch (e) {
    console.error("No se pudo crear notificación:", e.message);
  }
};

export const getNotificaciones = async (req, res) => {
  try {
    const { solo_no_leidas } = req.query;
    const filtro = solo_no_leidas === "true" ? { leida: false } : {};
    const items = await Notificacion.find(filtro).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
};

export const marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Notificacion.findByIdAndUpdate(id, { leida: true }, { new: true });
    if (!item) return res.status(404).json({ message: "No encontrada" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Error al marcar notificación" });
  }
};


