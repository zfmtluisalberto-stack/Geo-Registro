const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRegistros, validateRegistro, getDashboardSummary, buildRegistroFromForm, eliminarRegistro, actualizarRegistro, normalizarDatosImportados } = require('../app.js');

test('normalizeRegistros devuelve el fallback para datos inválidos', () => {
  const fallback = [{ id: 1, nombre: 'Demo' }];
  const result = normalizeRegistros('{bad json', fallback);
  assert.deepEqual(result, fallback);
});

test('validateRegistro rechaza campos requeridos vacíos', () => {
  const result = validateRegistro({ nombre: '', zona: '', fecha_ingreso: '', superficie: 0 });
  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, ['nombre', 'zona', 'fecha_ingreso', 'superficie']);
});

test('getDashboardSummary calcula las métricas esperadas', () => {
  const result = getDashboardSummary([
    { superficie: 100, tgm: 1.5, zona: 'Norte' },
    { superficie: 200, tgm: 2.5, zona: 'Sur' },
    { superficie: 300, tgm: 3.5, zona: 'Norte' }
  ]);

  assert.equal(result.total, 3);
  assert.equal(result.superficieTotal, 600);
  assert.equal(result.zonasUnicasCount, 2);
  assert.equal(result.tgmPromedio, '2.50');
});

test('buildRegistroFromForm genera un registro con el siguiente id', () => {
  const result = buildRegistroFromForm({
    nombre: 'Ana',
    zona: 'Centro',
    fecha_ingreso: '2026-07-06',
    fecha_respuesta: '',
    zf: 'Z-8',
    tgm: '1.25',
    superficie: '150',
    plano: 'plano.pdf',
    shp: '',
    imagen: ''
  }, [{ id: 1 }]);

  assert.equal(result.id, 2);
  assert.equal(result.nombre, 'Ana');
  assert.equal(result.zona, 'Centro');
  assert.equal(result.superficie, 150);
});

test('eliminarRegistro quita el elemento solicitado', () => {
  const result = eliminarRegistro([{ id: 1, nombre: 'Uno' }, { id: 2, nombre: 'Dos' }], 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 2);
});

test('actualizarRegistro reemplaza los datos del registro indicado', () => {
  const result = actualizarRegistro([{ id: 1, nombre: 'Uno', zona: 'Norte' }], 1, { nombre: 'Modificado', zona: 'Sur' });
  assert.equal(result[0].nombre, 'Modificado');
  assert.equal(result[0].zona, 'Sur');
});

test('normalizarDatosImportados convierte filas de Excel a registros compatibles', () => {
  const result = normalizarDatosImportados([
    { Nombre: 'Ana', Zona: 'Centro', 'Fecha de ingreso': '2026-07-06', 'Fecha de respuesta': '2026-07-08', ZF: 'Z-8', TGM: '1.25', Superficie: '150', Plano: 'plano.pdf', SHP: 'sector.zip', Imagen: 'foto.jpg' },
    { solicitante: 'Luis', zona: 'Norte', fecha_ingreso: '2026-07-10', fecha_respuesta: '', zf: '', tgm: '2.1', superficie: '200', plano: '', shp: '', imagen: '' }
  ]);

  assert.equal(result.length, 2);
  assert.equal(result[0].nombre, 'Ana');
  assert.equal(result[0].zona, 'Centro');
  assert.equal(result[0].superficie, 150);
  assert.equal(result[1].fecha_respuesta, '');
});
