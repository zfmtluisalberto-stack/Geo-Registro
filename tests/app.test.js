const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRegistros, validateRegistro, getDashboardSummary, buildRegistroFromForm } = require('../app.js');

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
