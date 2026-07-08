(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.GEORegistroApp = api;
  root.normalizeRegistros = api.normalizeRegistros;
  root.validateRegistro = api.validateRegistro;
  root.getDashboardSummary = api.getDashboardSummary;
  root.buildRegistroFromForm = api.buildRegistroFromForm;
  root.loadRegistros = api.loadRegistros;
  root.persistRegistros = api.persistRegistros;
  root.bindNavigation = api.bindNavigation;
  root.bindFileLabels = api.bindFileLabels;
  root.bindForm = api.bindForm;
  root.switchTab = api.switchTab;
  root.guardarRegistro = api.guardarRegistro;
  root.render = api.render;
  root.renderDashboard = api.renderDashboard;
  root.renderChartZonas = api.renderChartZonas;
  root.renderChartFechas = api.renderChartFechas;
  root.renderTabla = api.renderTabla;
  root.exportarDatos = api.exportarDatos;
  root.importarDatos = api.importarDatos;
  root.normalizarDatosImportados = api.normalizarDatosImportados;
  root.editarRegistro = api.editarRegistro;
  root.borrarRegistro = api.borrarRegistro;
  root.eliminarRegistro = api.eliminarRegistro;
  root.actualizarRegistro = api.actualizarRegistro;
  root.initialize = api.initialize;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const STORAGE_KEY = 'geo_registros';
  const FIREBASE_COLLECTION = 'registros';
  const defaultRegistros = [
    { id: 1, nombre: 'Juan Pérez Lozano', fecha_ingreso: '2026-01-10', fecha_respuesta: '2026-01-22', plano: 'plano_01.pdf', shp: 'poligono_norte.zip', imagen: 'captura1.png', zf: 'Z-1', tgm: 1.2, superficie: 1540.5, zona: 'Norte' },
    { id: 2, nombre: 'Desarrollos Urbanos SA', fecha_ingreso: '2026-02-14', fecha_respuesta: '', plano: 'plano_urb.pdf', shp: 'sector_sur.zip', imagen: '', zf: 'Z-3', tgm: 2.1, superficie: 4890, zona: 'Sur' },
    { id: 3, nombre: 'María Elena Gómez', fecha_ingreso: '2026-02-28', fecha_respuesta: '2026-03-05', plano: '', shp: '', imagen: 'terreno_centro.jpg', zf: 'Z-1', tgm: 0.85, superficie: 320.15, zona: 'Centro' }
  ];

  let registros = [];

  function normalizeRegistros(raw, fallback = defaultRegistros) {
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function serializarRegistrosParaUrl(items) {
    try {
      return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(items)))));
    } catch (error) {
      return '';
    }
  }

  function deserializarRegistrosDesdeUrl(serialized) {
    if (!serialized) return defaultRegistros;
    try {
      const decoded = decodeURIComponent(serialized);
      const parsed = JSON.parse(decodeURIComponent(escape(atob(decoded))));
      return Array.isArray(parsed) ? parsed : defaultRegistros;
    } catch (error) {
      return defaultRegistros;
    }
  }

  function getSharedRegistrosFromUrl() {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const payload = params.get('registros');
    if (!payload) return null;
    return deserializarRegistrosDesdeUrl(payload);
  }

  function updateUrlWithRegistros(items) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('registros', serializarRegistrosParaUrl(items));
    window.history.replaceState({}, '', url.toString());
  }

  function loadRegistros() {
    try {
      const shared = getSharedRegistrosFromUrl();
      if (shared) {
        return normalizeRegistros(JSON.stringify(shared), defaultRegistros);
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeRegistros(raw, defaultRegistros);
    } catch (error) {
      return defaultRegistros;
    }
  }

  function getFirebaseConfig() {
    if (typeof window !== 'undefined' && window.FIREBASE_CONFIG) {
      return window.FIREBASE_CONFIG;
    }

    return null;
  }

  function getFirestoreProxyUrl() {
    if (typeof window !== 'undefined' && window.FIRESTORE_PROXY_URL) {
      return window.FIRESTORE_PROXY_URL;
    }

    return null;
  }

  function isFirestoreDirectEnabled() {
    if (typeof window === 'undefined') return false;
    return window.FIRESTORE_DIRECT === true;
  }

  function isProxyUnavailableError(error) {
    const msg = error && error.message ? error.message.toString().toLowerCase() : '';
    return msg.includes('failed to fetch') || msg.includes('404') || msg.includes('not found') || msg.includes('proxy');
  }

  async function requestFirestoreProxy(method, body = null) {
    const proxyUrl = getFirestoreProxyUrl();
    if (!proxyUrl || typeof window === 'undefined' || typeof fetch !== 'function') {
      throw new Error('Proxy de Firestore no configurado');
    }

    const response = await fetch(proxyUrl, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : null
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(`Proxy error: ${response.status} ${response.statusText} - ${errorPayload}`);
    }

    return response.json();
  }

  function setSyncStatus(message, variant = 'warning') {
    if (typeof document === 'undefined') return;
    const element = document.getElementById('sync-status');
    if (!element) return;
    element.textContent = message;
    element.classList.toggle('success', variant === 'success');
    element.classList.toggle('warning', variant === 'warning');
    element.classList.toggle('error', variant === 'error');
  }

  function buildFirestoreErrorMessage(base, error) {
    const msg = error && error.message ? error.message : String(error);
    if (msg.toLowerCase().includes('permission')) {
      return base + ': ' + msg + '. Verifica las reglas de Firestore o usa el proxy Netlify.';
    }
    return base + ': ' + msg;
  }

  function syncFirebaseRegistros() {
    const proxyUrl = getFirestoreProxyUrl();
    if (proxyUrl) {
      setSyncStatus('Sincronizando con proxy Firestore...', 'warning');
      return requestFirestoreProxy('POST', { registros })
        .then(() => {
          setSyncStatus('Sincronizado con proxy Firestore', 'success');
        })
        .catch((e) => {
          if (isFirestoreDirectEnabled() && isProxyUnavailableError(e)) {
            console.warn('Proxy Firestore no disponible, intentando Firestore directo...', e);
            return syncFirebaseRegistrosDirect();
          }
          const msg = buildFirestoreErrorMessage('Error sincronizando proxy Firestore', e);
          setSyncStatus(msg, 'error');
          console.error('syncFirebaseRegistros proxy error:', e);
        });
    }

    if (isFirestoreDirectEnabled()) {
      return syncFirebaseRegistrosDirect();
    }

    setSyncStatus('Sin proxy de Firestore y Firestore directo no habilitado. Configure FIRESTORE_DIRECT o use proxy.', 'warning');
    return Promise.resolve();
  }

  function syncFirebaseRegistrosDirect() {
    const config = getFirebaseConfig();
    if (!config || typeof window === 'undefined' || !window.firebase || !window.firebase.firestore) {
      setSyncStatus('Firestore directo no disponible', 'warning');
      return Promise.resolve();
    }

    setSyncStatus('Sincronizando con Firestore directo...', 'warning');

    return new Promise((resolve) => {
      try {
        const db = window.firebase.firestore();
        const ref = db.collection(FIREBASE_COLLECTION).doc('app-data');
        ref.set({ registros, updatedAt: new Date().toISOString() })
          .then(() => {
            setSyncStatus('Sincronizado con Firestore directo', 'success');
            resolve();
          })
          .catch((e) => {
            const msg = buildFirestoreErrorMessage('Error sincronizando Firestore directo', e);
            setSyncStatus(msg, 'error');
            console.error('syncFirebaseRegistrosDirect error:', e);
            resolve();
          });
      } catch (error) {
        const msg = buildFirestoreErrorMessage('Error sincronizando Firestore directo', error);
        setSyncStatus(msg, 'error');
        console.error('syncFirebaseRegistrosDirect exception:', error);
        resolve();
      }
    });
  }

  function loadFirebaseRegistros() {
    const proxyUrl = getFirestoreProxyUrl();
    if (proxyUrl) {
      setSyncStatus('Cargando datos desde proxy Firestore...', 'warning');
      return requestFirestoreProxy('GET')
        .then((data) => {
          setSyncStatus('Datos cargados desde proxy Firestore', 'success');
          return Array.isArray(data?.registros) ? data.registros : null;
        })
        .catch((e) => {
          if (isFirestoreDirectEnabled() && isProxyUnavailableError(e)) {
            console.warn('Proxy Firestore no disponible, intentando cargar Firestore directo...', e);
            return loadFirebaseRegistrosDirect();
          }
          const msg = buildFirestoreErrorMessage('No se pudo cargar proxy Firestore', e);
          setSyncStatus(msg, 'error');
          console.error('loadFirebaseRegistros proxy error:', e);
          return null;
        });
    }

    if (isFirestoreDirectEnabled()) {
      return loadFirebaseRegistrosDirect();
    }

    setSyncStatus('Sin proxy de Firestore y Firestore directo no habilitado. Configure FIRESTORE_DIRECT o use proxy.', 'warning');
    return Promise.resolve(null);
  }

  function loadFirebaseRegistrosDirect() {
    const config = getFirebaseConfig();
    if (!config || typeof window === 'undefined' || !window.firebase || !window.firebase.firestore) {
      setSyncStatus('Firestore directo no disponible', 'warning');
      return Promise.resolve(null);
    }

    setSyncStatus('Cargando datos desde Firestore directo...', 'warning');

    return new Promise((resolve) => {
      try {
        const db = window.firebase.firestore();
        db.collection(FIREBASE_COLLECTION).doc('app-data').get().then((doc) => {
          if (doc.exists) {
            const data = doc.data();
            setSyncStatus('Datos cargados desde Firestore directo', 'success');
            resolve(Array.isArray(data?.registros) ? data.registros : null);
          } else {
            setSyncStatus('No hay datos en Firestore directo', 'warning');
            resolve(null);
          }
        }).catch((e) => {
          const msg = buildFirestoreErrorMessage('No se pudo cargar Firestore directo', e);
          setSyncStatus(msg, 'error');
          console.error('loadFirebaseRegistrosDirect error:', e);
          resolve(null);
        });
      } catch (error) {
        const msg = buildFirestoreErrorMessage('No se pudo cargar Firestore directo', error);
        setSyncStatus(msg, 'error');
        resolve(null);
      }
    });
  }

  function persistRegistros() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
      updateUrlWithRegistros(registros);
    } catch (error) {
      console.warn('No se pudo guardar en localStorage.', error);
    }

    syncFirebaseRegistros();
  }

  function validateRegistro(values) {
    const errors = [];
    const nombre = (values.nombre || '').toString().trim();
    const zona = (values.zona || '').toString().trim();
    const fechaIngreso = (values.fecha_ingreso || '').toString().trim();
    const superficie = (values.superficie || '').toString().trim();

    if (!nombre) errors.push('nombre');
    if (!zona) errors.push('zona');
    if (!fechaIngreso) errors.push('fecha_ingreso');
    if (!superficie || Number(superficie) <= 0) errors.push('superficie');

    return { isValid: errors.length === 0, errors };
  }

  function getDashboardSummary(items) {
    const total = Array.isArray(items) ? items.length : 0;
    const superficieTotal = items.reduce((acc, r) => acc + (Number(r.superficie) || 0), 0);
    const tgmPromedio = total ? (items.reduce((acc, r) => acc + (Number(r.tgm) || 0), 0) / total).toFixed(2) : '0';
    const zonasUnicas = [...new Set(items.map(r => r.zona).filter(Boolean))];

    return {
      total,
      superficieTotal,
      zonasUnicasCount: zonasUnicas.length,
      tgmPromedio
    };
  }

  function buildRegistroFromForm(formValues, existingRegistros) {
    return {
      id: existingRegistros.length ? Math.max(...existingRegistros.map(r => r.id)) + 1 : 1,
      nombre: (formValues.nombre || '').toString().trim(),
      zona: (formValues.zona || '').toString().trim(),
      fecha_ingreso: (formValues.fecha_ingreso || '').toString().trim(),
      fecha_respuesta: (formValues.fecha_respuesta || '').toString().trim(),
      zf: Number(formValues.zf) || 0,
      tgm: Number(formValues.tgm) || 0,
      superficie: Number(formValues.superficie) || 0,
      plano: (formValues.plano || '').toString().trim(),
      shp: (formValues.shp || '').toString().trim(),
      imagen: (formValues.imagen || '').toString().trim()
    };
  }

  function eliminarRegistro(items, id) {
    return items.filter(item => item.id !== Number(id));
  }

  function actualizarRegistro(items, id, payload) {
    return items.map(item => item.id === Number(id) ? { ...item, ...payload } : item);
  }

  function bindNavigation() {
    document.querySelectorAll('.nav button[data-view]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.view));
    });
  }

  function bindFileLabels() {
    ['plano', 'shp', 'imagen'].forEach(tipo => {
      const input = document.getElementById(`file_${tipo}`);
      if (!input) return;
      input.addEventListener('change', (e) => {
        const label = document.getElementById(`txt_${tipo}`);
        if (label) {
          label.textContent = e.target.files[0] ? e.target.files[0].name : 'Ningún archivo';
        }
      });
    });
  }

  function bindForm() {
    const form = document.getElementById('formRegistro');
    if (form) {
      form.addEventListener('submit', guardarRegistro);
    }
  }

  function switchTab(vista) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(btn => btn.classList.remove('active'));

    const target = document.getElementById(`view-${vista}`);
    if (target) target.classList.add('active');

    const navBtn = document.querySelector(`.nav button[data-view="${vista}"]`);
    if (navBtn) navBtn.classList.add('active');

    const title = document.getElementById('page-title');
    if (title) {
      title.textContent =
        vista === 'dashboard' ? 'Dashboard General' :
        vista === 'registro' ? 'Nuevo Registro de Expediente' : 'Listado General de Registros';
    }

    if (vista === 'dashboard') renderDashboard();
    if (vista === 'listado') renderTabla();
  }

  function guardarRegistro(e) {
    if (e) e.preventDefault();

    const datosFormulario = {
      nombre: document.getElementById('nombre').value,
      zona: document.getElementById('zona').value,
      fecha_ingreso: document.getElementById('fecha_ingreso').value,
      fecha_respuesta: document.getElementById('fecha_respuesta').value,
      zf: document.getElementById('zf').value,
      tgm: document.getElementById('tgm').value,
      superficie: document.getElementById('superficie').value,
      plano: document.getElementById('file_plano').files[0] ? document.getElementById('file_plano').files[0].name : '',
      shp: document.getElementById('file_shp').files[0] ? document.getElementById('file_shp').files[0].name : '',
      imagen: document.getElementById('file_imagen').files[0] ? document.getElementById('file_imagen').files[0].name : ''
    };

    const validation = validateRegistro(datosFormulario);
    if (!validation.isValid) {
      alert('Complete los campos obligatorios.');
      return;
    }

    const nuevo = buildRegistroFromForm(datosFormulario, registros);
    registros.unshift(nuevo);
    persistRegistros();
    document.getElementById('formRegistro').reset();
    ['plano', 'shp', 'imagen'].forEach(tipo => {
      const label = document.getElementById(`txt_${tipo}`);
      if (label) label.textContent = 'Ningún archivo';
    });
    alert('Registro guardado con éxito.');
    switchTab('listado');
  }

  function render() {
    persistRegistros();
    renderDashboard();
    renderTabla();
  }

  function renderDashboard() {
    const summary = getDashboardSummary(registros);
    document.getElementById('kpi-total').textContent = summary.total;
    document.getElementById('kpi-superficie').textContent = `${summary.superficieTotal.toLocaleString('es-MX')} m²`;
    document.getElementById('kpi-zonas').textContent = summary.zonasUnicasCount;
    document.getElementById('kpi-tgm').textContent = summary.tgmPromedio;

    renderChartZonas();
    renderChartFechas();
  }

  function renderChartZonas() {
    const conteoZonas = {};
    registros.forEach(r => {
      if (!r.zona) return;
      conteoZonas[r.zona] = (conteoZonas[r.zona] || 0) + 1;
    });

    const labels = Object.keys(conteoZonas);
    const values = Object.values(conteoZonas);
    const total = values.reduce((a, b) => a + b, 0);
    const colors = ['#10b981', '#2563eb', '#f59e0b', '#7c3aed', '#ec4899', '#64748b'];

    const container = document.getElementById('chart-zonas');
    if (!labels.length) {
      container.innerHTML = '<div class="empty">No hay datos suficientes para mostrar el gráfico.</div>';
      return;
    }

    const size = 220;
    const radius = 70;
    const center = size / 2;
    let startAngle = -90;
    let slices = '';
    labels.forEach((label, index) => {
      const value = values[index];
      const angle = (value / total) * 360;
      const endAngle = startAngle + angle;
      const largeArc = angle > 180 ? 1 : 0;
      const x1 = center + radius * Math.cos(startAngle * Math.PI / 180);
      const y1 = center + radius * Math.sin(startAngle * Math.PI / 180);
      const x2 = center + radius * Math.cos(endAngle * Math.PI / 180);
      const y2 = center + radius * Math.sin(endAngle * Math.PI / 180);
      slices += `<path d="M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[index % colors.length]}"></path>`;
      startAngle = endAngle;
    });

    container.innerHTML = `
      <div style="display:flex; gap:16px; align-items:center; justify-content:center; flex-wrap:wrap;">
        <svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label="Gráfico de zonas">${slices}</svg>
        <div>
          ${labels.map((label, index) => `<div style="display:flex; align-items:center; gap:8px; margin:6px 0;"><span style="width:12px;height:12px;border-radius:50%;background:${colors[index % colors.length]}"></span>${label}: ${values[index]}</div>`).join('')}
        </div>
      </div>
    `;
  }

  function renderChartFechas() {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const ingresos = Array(12).fill(0);
    const respuestas = Array(12).fill(0);

    registros.forEach(r => {
      if (r.fecha_ingreso) {
        const mes = new Date(r.fecha_ingreso).getMonth();
        if (!Number.isNaN(mes)) ingresos[mes] += 1;
      }
      if (r.fecha_respuesta) {
        const mes = new Date(r.fecha_respuesta).getMonth();
        if (!Number.isNaN(mes)) respuestas[mes] += 1;
      }
    });

    const maxValue = Math.max(...ingresos, ...respuestas, 1);
    const bars = meses.map((mes, index) => {
      const h1 = Math.max(8, (ingresos[index] / maxValue) * 100);
      const h2 = Math.max(8, (respuestas[index] / maxValue) * 100);
      return `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;">
          <div style="height:170px; display:flex; align-items:flex-end; gap:6px;">
            <div style="width:16px; height:${h1}%; background:#2563eb; border-radius:6px 6px 0 0;"></div>
            <div style="width:16px; height:${h2}%; background:#10b981; border-radius:6px 6px 0 0;"></div>
          </div>
          <div style="font-size:0.8rem; color:#64748b;">${mes}</div>
        </div>
      `;
    }).join('');

    document.getElementById('chart-fechas').innerHTML = `
      <div style="display:flex; gap:8px; align-items:flex-end; justify-content:space-between; height:100%;">
        ${bars}
      </div>
      <div style="display:flex; gap:16px; justify-content:center; margin-top:12px; font-size:0.85rem; color:#334155;">
        <span>● Ingresados</span>
        <span>● Respondidos</span>
      </div>
    `;
  }

  function renderTabla() {
    const tbody = document.getElementById('tabla-registros');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!registros.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">No hay registros cargados en el sistema.</td></tr>';
      return;
    }

    registros.forEach(r => {
      tbody.innerHTML += `
        <tr>
          <td>#${r.id}</td>
          <td><strong>${r.nombre}</strong></td>
          <td><span class="tag">${r.zona}</span></td>
          <td>
            <div>${r.fecha_ingreso}</div>
            <div class="${r.fecha_respuesta ? 'muted' : 'warning'}">${r.fecha_respuesta || 'Pendiente'}</div>
          </td>
          <td>
            <div>ZF: ${r.zf || 'N/A'}</div>
            <div>TGM: ${Number(r.tgm || 0).toFixed(2)}</div>
          </td>
          <td>${Number(r.superficie || 0).toLocaleString('es-MX')} m²</td>
          <td>
            <div class="pill-group">
              ${r.plano ? '<span class="doc-tag doc-pdf">PDF</span>' : ''}
              ${r.shp ? '<span class="doc-tag doc-shp">SHP</span>' : ''}
              ${r.imagen ? '<span class="doc-tag doc-img">IMG</span>' : ''}
              ${!r.plano && !r.shp && !r.imagen ? '<span class="muted">Sin archivos</span>' : ''}
            </div>
          </td>
          <td>
            <div class="pill-group">
              <button type="button" class="btn btn-secondary" onclick="window.GEORegistroApp.editarRegistro(${r.id})">Editar</button>
              <button type="button" class="btn btn-secondary" onclick="window.GEORegistroApp.borrarRegistro(${r.id})">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  function obtenerValorCampo(row, aliases) {
    if (!row || typeof row !== 'object') return '';
    const entries = Object.entries(row).filter(([key]) => key !== undefined);
    const lookup = new Map(entries.map(([key, value]) => [String(key).trim().toLowerCase(), value]));

    for (const alias of aliases) {
      const key = lookup.get(alias.toLowerCase());
      if (key !== undefined) return key;
    }

    return '';
  }

  function normalizarDatosImportados(datosImportados, registrosBase = []) {
    if (!Array.isArray(datosImportados)) return [];

    const registrosBaseValidos = Array.isArray(registrosBase) ? registrosBase : [];
    const siguienteId = registrosBaseValidos.length ? Math.max(...registrosBaseValidos.map(r => Number(r.id) || 0)) + 1 : 1;

    return datosImportados
      .map((fila, index) => {
        const nombre = String(obtenerValorCampo(fila, ['nombre', 'solicitante', 'nombre del solicitante', 'nombre_solicitante']) || '').trim();
        const zona = String(obtenerValorCampo(fila, ['zona', 'zone']) || '').trim();
        const fechaIngreso = String(obtenerValorCampo(fila, ['fecha_ingreso', 'fecha de ingreso', 'fechaingreso']) || '').trim();
        const fechaRespuesta = String(obtenerValorCampo(fila, ['fecha_respuesta', 'fecha de respuesta']) || '').trim();
        const zf = String(obtenerValorCampo(fila, ['zf', 'zf (zona federal)']) || '').trim();
        const tgm = String(obtenerValorCampo(fila, ['tgm']) || '').trim();
        const superficie = String(obtenerValorCampo(fila, ['superficie']) || '').trim();
        const plano = String(obtenerValorCampo(fila, ['plano']) || '').trim();
        const shp = String(obtenerValorCampo(fila, ['shp', 'shape', 'shapefile']) || '').trim();
        const imagen = String(obtenerValorCampo(fila, ['imagen', 'foto', 'imagen_terreno']) || '').trim();

        if (!nombre && !zona && !fechaIngreso && !superficie) return null;

        return {
          id: siguienteId + index,
          nombre,
          zona,
          fecha_ingreso: fechaIngreso,
          fecha_respuesta: fechaRespuesta,
          zf: zf || 'N/A',
          tgm: Number(tgm) || 0,
          superficie: Number(superficie) || 0,
          plano,
          shp,
          imagen
        };
      })
      .filter(Boolean);
  }

  function parsearCsv(texto) {
    if (!texto) return [];
    const lineas = texto.split(/\r?\n/).map(linea => linea.trim()).filter(Boolean);
    if (!lineas.length) return [];

    const delimiter = lineas[0].includes(';') && !lineas[0].includes(',') ? ';' : (lineas[0].includes('\t') ? '\t' : ',');
    const encabezados = lineas[0].split(delimiter).map(c => c.trim().replace(/^['"]|['"]$/g, ''));

    return lineas.slice(1).map(linea => {
      const celdas = linea.split(delimiter).map(c => c.trim().replace(/^['"]|['"]$/g, ''));
      return encabezados.reduce((acc, header, index) => {
        acc[header] = celdas[index] || '';
        return acc;
      }, {});
    }).filter(fila => Object.values(fila).some(valor => String(valor).trim()));
  }

  function exportarDatos() {
    const blob = new Blob([JSON.stringify(registros, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'geo-registros.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function importarDatos(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = (file.name.split('.').pop() || '').toLowerCase();
    const leerComoTexto = () => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsText(file);
    });

    const leerComoArrayBuffer = () => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsArrayBuffer(file);
    });

    const procesarArchivo = async () => {
      try {
        if (extension === 'json') {
          const texto = await leerComoTexto();
          const datos = JSON.parse(texto);
          const payload = Array.isArray(datos) ? datos : (datos && Array.isArray(datos.registros) ? datos.registros : null);
          if (!payload) throw new Error('Formato inválido');
          registros = [...registros, ...normalizarDatosImportados(payload, registros)];
        } else if (['xlsx', 'xls', 'ods'].includes(extension) && typeof window !== 'undefined' && window.XLSX) {
          const buffer = await leerComoArrayBuffer();
          const workbook = window.XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const datos = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
          registros = [...registros, ...normalizarDatosImportados(datos, registros)];
        } else if (['csv', 'tsv'].includes(extension)) {
          const texto = await leerComoTexto();
          const datos = parsearCsv(texto);
          registros = [...registros, ...normalizarDatosImportados(datos, registros)];
        } else {
          throw new Error('Formato no soportado');
        }

        persistRegistros();
        render();
        alert('Datos importados correctamente.');
      } catch (error) {
        console.error(error);
        alert('No se pudo importar el archivo. Usa JSON, CSV o Excel (.xlsx/.xls).');
      }
    };

    procesarArchivo();
    e.target.value = '';
  }

  function editarRegistro(id) {
    const registro = registros.find(item => item.id === Number(id));
    if (!registro) return;

    const nombre = prompt('Nombre del solicitante:', registro.nombre);
    if (nombre === null) return;

    const zona = prompt('Zona:', registro.zona);
    if (zona === null) return;

    const fechaIngreso = prompt('Fecha de ingreso (YYYY-MM-DD):', registro.fecha_ingreso);
    if (fechaIngreso === null) return;

    const fechaRespuesta = prompt('Fecha de respuesta (YYYY-MM-DD, dejar vacío si no aplica):', registro.fecha_respuesta || '');
    if (fechaRespuesta === null) return;

    const zf = prompt('ZF:', registro.zf || '');
    if (zf === null) return;

    const tgm = prompt('TGM:', registro.tgm || '0');
    if (tgm === null) return;

    const superficie = prompt('Superficie (m²):', registro.superficie || '0');
    if (superficie === null) return;

    const actualizado = actualizarRegistro(registros, id, {
      nombre: nombre.trim(),
      zona: zona.trim(),
      fecha_ingreso: fechaIngreso.trim(),
      fecha_respuesta: fechaRespuesta.trim(),
      zf: zf.trim() || 'N/A',
      tgm: Number(tgm) || 0,
      superficie: Number(superficie) || 0
    });

    registros = actualizado;
    persistRegistros();
    renderTabla();
    renderDashboard();
    alert('Registro actualizado.');
  }

  function borrarRegistro(id) {
    if (!confirm('¿Desea eliminar este registro?')) return;
    registros = eliminarRegistro(registros, id);
    persistRegistros();
    render();
    alert('Registro eliminado.');
  }

  async function initialize() {
    const firebaseRegistros = await loadFirebaseRegistros();
    registros = Array.isArray(firebaseRegistros) && firebaseRegistros.length ? firebaseRegistros : loadRegistros();
    if (typeof window !== 'undefined' && !window.location.search.includes('registros=')) {
      updateUrlWithRegistros(registros);
    }
    bindFileLabels();
    bindNavigation();
    bindForm();
    render();
    switchTab('dashboard');
  }

  return {
    normalizeRegistros,
    validateRegistro,
    getDashboardSummary,
    buildRegistroFromForm,
    loadRegistros,
    persistRegistros,
    serializarRegistrosParaUrl,
    deserializarRegistrosDesdeUrl,
    getFirebaseConfig,
    bindNavigation,
    bindFileLabels,
    bindForm,
    switchTab,
    guardarRegistro,
    render,
    renderDashboard,
    renderChartZonas,
    renderChartFechas,
    renderTabla,
    exportarDatos,
    importarDatos,
    normalizarDatosImportados,
    editarRegistro,
    borrarRegistro,
    eliminarRegistro,
    actualizarRegistro,
    initialize
  };
});
