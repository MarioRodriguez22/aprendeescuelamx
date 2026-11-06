# AprendeEscuelaMx

Aplicación para primaria con React/Vite, Node/Express y SQLite. Las cuentas se crean en la propia aplicación con un nombre de usuario y contraseña; cada cuenta conserva por separado sus fotos, preguntas y exámenes.

## Requisitos

- Node.js 20 o posterior.
- Una clave de Gemini si se desea generar análisis y preguntas con IA.

## Preparación

En `backend`, instala dependencias y copia `.env.example` a `.env`. Configura `GEMINI_API_KEY` en ese archivo; `AI_PROVIDER=auto` usa Gemini primero. No subas `.env` ni los archivos de la base de datos.

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm start
```

En otra terminal, desde `frontend`:

```powershell
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`, crea una cuenta y carga tus fotos. Las imágenes nuevas se guardan en la base SQLite del servidor, agrupadas por materia y asociadas a la cuenta que las subió. Para usar otro generador, configura sus variables en `backend/.env`.

## Panel de administración

En `backend/.env`, configura `ADMIN_USERNAME` y `ADMIN_PASSWORD` con un nombre de usuario de 3 a 32 caracteres y una contraseña de al menos 12 caracteres. Configura ambos valores juntos. Al iniciar el backend, esa cuenta queda reservada con rol de administrador; inicia sesión con esas credenciales y usa **Panel de administración** para consultar los nombres, roles y fechas de registro. El panel no muestra contraseñas ni datos privados.

Al iniciar el backend, las credenciales de administrador de `.env` se vuelven a aplicar y sus sesiones anteriores se cierran. Mantén ese archivo fuera del control de versiones; nunca publiques la contraseña.

Los registros de fotos creados antes de esta versión contienen el texto y su análisis, pero no la imagen original. Se asocian a la primera cuenta que se registre; vuelve a cargar esas fotos si quieres que aparezcan sus miniaturas.

## Pruebas

```powershell
cd backend
npm test
```
