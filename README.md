# GEO-REGISTRO

Sistema web para registrar, visualizar y administrar solicitudes de territorio y documentación asociada.

## Características
- Dashboard con métricas básicas y gráficos simples
- Formulario para crear nuevos registros con validación de campos obligatorios
- Listado de registros con estado y archivos asociados
- Almacenamiento local con localStorage para persistencia entre sesiones
- Exportación e importación de datos en formato JSON y soporte para archivos Excel/CSV
- Lógica reutilizable y pruebas automáticas básicas para verificar el funcionamiento

## Uso local
1. Abrir el archivo [index.html](index.html) en el navegador, o servir la carpeta con un servidor estático.
2. Para una vista local rápida:
   - `python3 -m http.server 8123`
   - Abrir `http://127.0.0.1:8123/`

## Publicación en GitHub Pages
1. Crear un repositorio en GitHub.
2. Vincularlo con este directorio:
   - `git remote add origin https://github.com/USUARIO/REPOSITORIO.git`
   - `git branch -M main`
   - `git push -u origin main`
3. En GitHub, ir a Settings > Pages y seleccionar la acción de deployment.

La carpeta ya incluye un workflow para publicar automáticamente.

## Despliegue en Netlify (recomendado para Firestore)
1. Crea una cuenta en https://app.netlify.com/ y conéctala con GitHub.
2. Selecciona el repositorio `zfmtluisalberto-stack/Geo-Registro`.
3. En **Build settings** usa:
   - Build command: dejar vacío
   - Publish directory: `.`
4. Genera la clave de servicio de Firebase:
   - Abre la consola de Firebase en https://console.firebase.google.com/.
   - Selecciona el proyecto `geo-cnr`.
   - Ve a Configuración del proyecto > Cuentas de servicio.
   - Haz clic en "Generar nueva clave privada" y descarga el JSON.
   - Conserva el archivo en tu máquina y abre el contenido como texto.
5. Agrega variables de entorno en Netlify:
   - `FIREBASE_SERVICE_ACCOUNT`: copia y pega el JSON completo de la clave privada.
   - `FIREBASE_PROJECT_ID`: `geo-cnr`
   - `FIRESTORE_COLLECTION`: `registros`
6. Publica el sitio.

> Nota: la variable `FIREBASE_SERVICE_ACCOUNT` puede ser un valor multilínea; en la UI de Netlify se acepta el JSON completo tal como lo descargaste.

## Ejemplo de service account JSON
También añadí un ejemplo en `firebase-service-account.example.json` para que uses el formato correcto sin perder la estructura del archivo.

## Uso del proxy de Firestore en Netlify
Para habilitar el proxy de Firestore desde el frontend, agrega esta línea antes de cargar `app.js` en `index.html`:
```html
<script>
  window.FIRESTORE_PROXY_URL = '/.netlify/functions/firestoreProxy';
</script>
```

Esto permite que la app use un backend seguro en Netlify para leer y escribir en Firestore, evitando problemas de CORS o de políticas de seguridad del navegador.

### Si ves "Missing or insufficient permissions"
Eso significa que estás usando la conexión directa a Firestore desde el navegador y las reglas de Firestore no permiten acceso.

Solución recomendada:
- usa el proxy Netlify como se explicó arriba,
- o cambia temporalmente las reglas de Firestore para permitir lectura y escritura anónimas (no recomendado en producción).

Si necesita usar Firestore directo desde el navegador, agregue esta línea antes de cargar `app.js`:
```html
<script>window.FIRESTORE_DIRECT = true;</script>
```
Solo use esto si comprende los riesgos y sus reglas de Firestore lo permiten.

Regla temporal mínima para pruebas (Firestore rules):
```js
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Luego vuelve a desplegar y prueba de nuevo.
