import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { methods as authentication } from "./controllers/authentication.controller.js";
import pacienteRoutes from "../BACKEND/Routes/pacientes.routes.js";
import connectDB from "../BACKEND/Config/mongodb.js";
import open from "open";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set("port", 5000);

// Configuración
app.use(express.json());
app.use(express.static(path.join(__dirname, "../FRONTEND"))); // sirve CSS, JS, imágenes

connectDB(); // Conectarse a la BD antesd e que ejecute el servidor

// Rutas HTML
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../FRONTEND/index.html"))
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "../FRONTEND/login.html"))
);
app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "../FRONTEND/register.html"))
);
app.get("/password", (req, res) =>
  res.sendFile(path.join(__dirname, "../FRONTEND/password.html"))
);
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "../FRONTEND/login_exitoso/admin.html"))
);
app.get("/user", (req, res) =>
  res.sendFile(path.join(__dirname, "../FRONTEND/index2.html"))
);
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "../FRONTEND/login_exitoso/admin.html"))
);
app.get("/admin/pacientes", (req, res) =>
  res.sendFile(path.join(__dirname, "../FRONTEND/login_exitoso/pacientes.html"))
);
app.get("/admin/citas", (req, res) =>
  res.sendFile(path.join(__dirname, "../FRONTEND/login_exitoso/citas.html"))
);
app.get("/admin/resultados", (req, res) =>
  res.sendFile(
    path.join(__dirname, "../FRONTEND/login_exitoso/resultados.html")
  )
);
app.get("/admin/reportes", (req, res) =>
  res.sendFile(path.join(__dirname, "../FRONTEND/login_exitoso/reportes.html"))
);

// Rutas API
app.post("/api/register", authentication.register);
app.post("/api/login", authentication.login);
app.post("/api/password", authentication.password);

app.use("/api", pacienteRoutes);
// Servidor
app.listen(app.get("port"), async () => {
  const url = `http://localhost:${app.get("port")}`;
  console.log(`✅ Servidor corriendo en ${url}`);

  // Abre automáticamente el navegador
  try {
    await open(url);
    console.log("🌐 Navegador abierto correctamente.");
  } catch (error) {
    console.error("⚠️ No se pudo abrir el navegador:", error);
  }
});
