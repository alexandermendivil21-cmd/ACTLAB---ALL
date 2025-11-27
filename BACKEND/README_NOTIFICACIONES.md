# Sistema de Notificaciones por Correo

Este sistema envía automáticamente notificaciones por correo electrónico a los pacientes cuando faltan 2 horas para su cita programada.

## Configuración

### 1. Instalar dependencias

```bash
cd BACKEND
npm install
```

Esto instalará las dependencias necesarias:
- `nodemailer`: Para enviar correos electrónicos
- `node-cron`: Para programar tareas periódicas

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `BACKEND` con las siguientes variables:

```env
# Configuración de Correo Electrónico
EMAIL_SERVICE=gmail
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion
```

#### Para Gmail:

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la verificación en dos pasos si no la tienes activada
3. Ve a "Contraseñas de aplicaciones": https://myaccount.google.com/apppasswords
4. Genera una nueva contraseña de aplicación para "Correo"
5. Usa esa contraseña (no tu contraseña normal de Gmail) en `EMAIL_PASSWORD`

#### Para otros proveedores:

- **Outlook/Hotmail**: Usa `EMAIL_SERVICE=outlook`
- **Yahoo**: Usa `EMAIL_SERVICE=yahoo`
- **Otros**: Consulta la documentación de nodemailer para configuraciones personalizadas

### 3. Reiniciar el servidor

Después de configurar las variables de entorno, reinicia el servidor:

```bash
npm run dev
```

## Funcionamiento

- El sistema verifica automáticamente las citas cada **15 minutos**
- Cuando una cita está programada para dentro de **1.5 a 2.5 horas**, se envía una notificación
- Solo se envía una notificación por cita (marcada con `notificacion2HorasEnviada: true`)
- Solo se envían notificaciones para citas con estado "confirmada" o "pendiente"

## Estructura de archivos

- `BACKEND/services/email.service.js`: Servicio para enviar correos
- `BACKEND/services/cita-notificaciones.service.js`: Lógica para verificar y enviar notificaciones
- `BACKEND/models/Cita.js`: Modelo actualizado con campo `notificacion2HorasEnviada`
- `BACKEND/index.js`: Configuración del cron job

## Solución de problemas

### El correo no se envía

1. Verifica que las variables de entorno estén correctamente configuradas
2. Para Gmail, asegúrate de usar una "Contraseña de aplicación", no tu contraseña normal
3. Revisa los logs del servidor para ver mensajes de error específicos

### Error de autenticación

- Si usas Gmail, verifica que la verificación en dos pasos esté activada
- Asegúrate de usar la contraseña de aplicación correcta
- Verifica que `EMAIL_USER` sea el correo completo (ej: `usuario@gmail.com`)

### Las notificaciones no se envían automáticamente

- Verifica que el servidor esté corriendo
- Revisa los logs para ver si el cron job se está ejecutando
- Verifica que las citas tengan el estado correcto ("confirmada" o "pendiente")

