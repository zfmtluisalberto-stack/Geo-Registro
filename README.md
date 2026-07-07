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
