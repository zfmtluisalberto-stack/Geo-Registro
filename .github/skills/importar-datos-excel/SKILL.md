---
name: importar-datos-excel
description: "Use when: necesitas agregar soporte para importar registros desde Excel, CSV o JSON a una app web que ya maneja datos en localStorage."
---

# Importar datos desde Excel o CSV

## Objetivo
Agregar una ruta de importación que permita cargar filas tabulares desde Excel, CSV o JSON y convertirlas en registros compatibles con la aplicación.

## Flujo recomendado
1. Identificar los campos esperados por la app (por ejemplo: nombre, zona, fecha_ingreso, fecha_respuesta, zf, tgm, superficie, plano, shp, imagen).
2. Crear un normalizador que traduzca nombres alternativos de columnas a los nombres internos del modelo.
3. Añadir soporte para leer archivos desde el navegador usando FileReader o una librería como XLSX para Excel.
4. Fusionar los datos importados con los registros existentes sin perder la información ya guardada.
5. Persistir los datos y refrescar la vista para que los cambios aparezcan inmediatamente.

## Criterios de aceptación
- La importación acepta al menos JSON y CSV/Excel.
- Los campos se asignan correctamente aunque los encabezados del archivo cambien ligeramente.
- Los registros nuevos se guardan con ids únicos y sin romper los existentes.
- La interfaz muestra un feedback claro cuando la importación termina.

## Recomendaciones
- Mantener el normalizador aislado para que pueda probarse por separado.
- Aceptar alias de columnas comunes para reducir fricciones con archivos exportados desde otras fuentes.
- Usar validación mínima antes de guardar para evitar registros vacíos.
