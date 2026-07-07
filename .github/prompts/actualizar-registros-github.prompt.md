---
mode: agent
description: "Use when: necesitas implementar que los registros se actualicen al agregar o eliminar y que la app sea consultable desde cualquier dispositivo con el enlace de GitHub."
---

# Prompt: actualizar registros y acceso remoto

Actúa como asistente de desarrollo para mejorar esta aplicación web de registro CNR.

## Contexto del proyecto
- Es una app estática basada en HTML, CSS y JavaScript.
- Los datos se almacenan en localStorage bajo la clave geo_registros.
- La app debe poder abrirse y usarse desde cualquier dispositivo con el enlace público del proyecto en GitHub.
- El objetivo es que los cambios realizados al agregar o eliminar registros se reflejen inmediatamente en la interfaz y permanezcan disponibles al volver a abrir la app.

## Tarea a realizar
Implementa o ajusta la funcionalidad para que:
- al agregar un registro, este aparezca en la lista y se actualice correctamente la vista;
- al eliminar un registro, la lista se actualice sin errores y la información se mantenga consistente;
- la app siga siendo útil y accesible desde cualquier dispositivo que tenga el link de GitHub;
- si aplica, se mantenga compatible con GitHub Pages o un despliegue estático público.

## Reglas importantes
- Mantén la app sencilla y compatible con el entorno estático actual.
- Conserva los nombres de campos y textos en español.
- Usa las funciones y patrones existentes del proyecto cuando sea posible.
- Evita introducir herramientas pesadas o dependencias innecesarias.
- Si cambias la lógica de datos, asegúrate de conservar la persistencia y la coherencia entre la UI y el almacenamiento.
- Verifica el comportamiento con pruebas o validación práctica cuando sea posible.

## Entregable esperado
1. Explica brevemente qué se modificó.
2. Indica si la actualización de registros funciona al agregar y eliminar.
3. Menciona cómo quedó la compatibilidad con acceso remoto desde GitHub.
4. Si corresponde, incluye evidencia de verificación como pruebas ejecutadas o resultados observados.
