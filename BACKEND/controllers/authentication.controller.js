// controllers/authentication.controller.js
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js"; // 👈 importa el modelo
import Personal from "../models/Personal.js"; // 👈 importa el modelo de Personal

dotenv.config();

/** REGISTER **/
export async function register(req, res) {
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
    console.log(" Datos recibidos en req.body:", req.body);


    if (!rawTipo || !num_documento || !fecha_emision || !nombres || !apellidos || !edad || !genero || !direccion || !celular || !email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan campos obligatorios." });
    }


    const tipo = rawTipo.toLowerCase();
    if (!["dni", "pasaporte", "carnet-ext"].includes(tipo)) {
      return res.status(400).json({ ok: false, message: "Tipo de documento inválido." });
    }

    if (
      !/^\d+$/.test(num_documento) ||
      ((tipo === "dni" || tipo === "pasaporte") && num_documento.length !== 8) ||
      (tipo === "carnet-ext" && num_documento.length !== 9)
    ) {
      return res.status(400).json({ ok: false, message: "Número de documento inválido." });
    }

    const fecha = new Date(fecha_emision);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (isNaN(fecha) || fecha >= hoy) {
      return res.status(400).json({ ok: false, message: "Fecha de emisión inválida." });
    }

    // Edad
    const edadNum = Number(edad);
    if (Number.isNaN(edadNum) || edadNum < 0 || edadNum > 120) {
      return res.status(400).json({ ok: false, message: "Edad inválida." });
    }

    // 🔍 Verificar si ya existe en BD (Usuario o Personal)
    const existeUsuario = await Usuario.findOne({ tipo_documento: tipo, num_documento });
    const existePersonal = await Personal.findOne({ tipo_documento: tipo, num_documento });
    
    if (existeUsuario || existePersonal) {
      return res.status(400).json({ ok: false, message: "Usuario ya registrado." });
    }

    const salt = await bcryptjs.genSalt(5);
    const hash = await bcryptjs.hash(password, salt);

    // Guardar en MongoDB
    await Usuario.create({
      tipo_documento: tipo,
      num_documento,
      fecha_emision: fecha,
      nombres,
      apellidos,
      edad: edadNum,
      genero,
      direccion,
      celular,
      email,
      password: hash,
    });


    return res.status(201).json({
      ok: true,
      message: "Usuario registrado con éxito.",
      redirect: "/login",
    });
  } catch (err) {
    console.error("Error en register:", err);
    return res.status(500).json({ ok: false, message: "Error interno." });
  }
}

/** LOGIN **/
export async function login(req, res) {
  try {
    const { tipo_documento, num_documento, password } = req.body;
    if (!tipo_documento || !num_documento || !password) {
      return res.status(400).json({ ok: false, message: "Faltan campos." });
    }

    const tipo = tipo_documento.toLowerCase();

    // Admin hardcodeado
    if (tipo === "dni" && num_documento === "73066688" && password === "admin123") {
      const token = jwt.sign(
        { tipo_documento: tipo, num_documento, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        ok: true,
        message: "Login exitoso como ADMIN.",
        token,
        role: "admin",
        redirect: "/admin",
      });
    }

    // 🔍 Buscar usuario en MongoDB (Pacientes)
    const user = await Usuario.findOne({ tipo_documento: tipo, num_documento });

    // Si no se encuentra en Usuario, buscar en Personal
    if (!user) {
      const personal = await Personal.findOne({ tipo_documento: tipo, num_documento });
      
      if (!personal) {
        return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
      }

      // Verificar si el personal está activo
      if (personal.estado !== "activo") {
        return res.status(403).json({ 
          ok: false, 
          message: "Tu cuenta está inactiva. Contacta al administrador." 
        });
      }

      // Verificar contraseña
      const match = await bcryptjs.compare(password, personal.password);
      if (!match) {
        return res.status(401).json({ ok: false, message: "Contraseña incorrecta." });
      }

      // Login exitoso para personal
      const token = jwt.sign(
        { 
          tipo_documento: tipo, 
          num_documento, 
          role: "personal",
          cargo: personal.cargo,
          email: personal.email
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      console.log("✅ Login exitoso para personal:", {
        tipo_documento: tipo,
        num_documento,
        cargo: personal.cargo,
        nombres: personal.nombres
      });

      // Redirigir según el cargo
      let redirectPath = "/admin";
      if (personal.cargo === "medico") {
        redirectPath = "/admin/citas"; // Los médicos van directamente a citas
      }

      return res.status(200).json({
        ok: true,
        message: `Login exitoso como ${personal.cargo}.`,
        token,
        role: "personal",
        cargo: personal.cargo,
        redirect: redirectPath,
        email: personal.email,
        nombres: personal.nombres,
        apellidos: personal.apellidos
      });
    }

    // Si se encuentra en Usuario (Paciente)
    const match = await bcryptjs.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Contraseña incorrecta." });
    }

    const token = jwt.sign(
      { tipo_documento: tipo, num_documento, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("✅ Login exitoso para paciente:", {
      tipo_documento: tipo,
      num_documento,
      email: user.email
    });

    return res.status(200).json({
      ok: true,
      message: "Login exitoso.",
      token,
      role: "user",
      redirect: "/user",
      email: user.email,
    });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ ok: false, message: "Error interno." });
  }
}

/** CHANGE PASSWORD **/
export async function password(req, res) {
  try {
    const { current_password, new_password, repeat_password } = req.body;

    if (!current_password || !new_password || !repeat_password) {
      return res.status(400).json({ ok: false, message: "Faltan campos." });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ ok: false, message: "Mínimo 8 caracteres." });
    }

    if (new_password !== repeat_password) {
      return res.status(400).json({ ok: false, message: "Las contraseñas no coinciden." });
    }

    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, message: "Token faltante." });
    }

    let payload;
    try {
      payload = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ ok: false, message: "Token inválido o expirado." });
    }

    // 🔍 Buscar usuario en BD (Usuario o Personal)
    let user = await Usuario.findOne({
      tipo_documento: payload.tipo_documento,
      num_documento: payload.num_documento,
    });

    let isPersonal = false;

    // Si no se encuentra en Usuario, buscar en Personal
    if (!user) {
      user = await Personal.findOne({
        tipo_documento: payload.tipo_documento,
        num_documento: payload.num_documento,
      });
      isPersonal = true;
    }

    if (!user) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
    }

    const match = await bcryptjs.compare(current_password, user.password);
    if (!match) {
      return res.status(401).json({ ok: false, message: "Contraseña actual incorrecta." });
    }

    const salt = await bcryptjs.genSalt(5);
    user.password = await bcryptjs.hash(new_password, salt);

    // Guardar cambios
    await user.save();

    // Generar nuevo token según el tipo de usuario
    const tokenPayload = {
      tipo_documento: user.tipo_documento,
      num_documento: user.num_documento
    };

    if (isPersonal) {
      tokenPayload.role = "personal";
      tokenPayload.cargo = user.cargo;
      tokenPayload.email = user.email;
    } else {
      tokenPayload.role = "user";
    }

    const newToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log(`✅ Contraseña actualizada para ${isPersonal ? 'personal' : 'paciente'}:`, {
      tipo_documento: user.tipo_documento,
      num_documento: user.num_documento
    });

    return res.status(200).json({
      ok: true,
      message: "Contraseña actualizada con éxito.",
      token: newToken,
      redirect: "/login",
    });
  } catch (err) {
    console.error("Error en password():", err);
    return res.status(500).json({ ok: false, message: "Error interno." });
  }
}

export const methods = { register, login, password };
