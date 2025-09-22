// --- Exportar e importar datos ---
function exportRentals() {
  const data = localStorage.getItem('rentals') || '[]';
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'alquileres.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function importRentals(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const arr = JSON.parse(e.target.result);
      if (Array.isArray(arr)) {
        localStorage.setItem('rentals', JSON.stringify(arr));
        bloc.emit();
        alert('Datos importados correctamente.');
      } else {
        alert('El archivo no contiene un array válido.');
      }
    } catch {
      alert('Archivo JSON inválido.');
    }
  };
  reader.readAsText(file);
}

// Agregar botones a la UI si no existen
window.addEventListener('DOMContentLoaded', () => {
  let exportBtn = document.getElementById('exportBtn');
  let importInput = document.getElementById('importInput');
  if (!exportBtn) {
    exportBtn = document.createElement('button');
    exportBtn.id = 'exportBtn';
    exportBtn.textContent = 'Exportar datos';
    exportBtn.style.marginRight = '8px';
    exportBtn.onclick = exportRentals;
    rentalForm.parentNode.insertBefore(exportBtn, rentalForm);
  }
  if (!importInput) {
    importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json,application/json';
    importInput.id = 'importInput';
    importInput.style.marginRight = '8px';
    importInput.onchange = importRentals;
    rentalForm.parentNode.insertBefore(importInput, rentalForm);
  }
});
// Limpia el formulario y los campos opcionales seleccionados
function resetForm() {
  rentalForm.reset();
  selectedOptionalFields = [];
  renderOptionalFieldsSelector();
  renderOptionalFieldsInputs();
  // Si hay un botón de cancelar edición, lo ocultamos
  if (cancelEditBtn) cancelEditBtn.style.display = 'none';
}
// app.js SOLO versión BLoC, limpio y funcional
const rentalForm = document.getElementById('rentalForm');
const rentalList = document.getElementById('rentalList');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');


// Definición de campos opcionales
const OPTIONAL_FIELDS = [
  { key: 'metros', label: 'Metros cuadrados', type: 'number', attrs: { min: 0, step: 1, placeholder: 'm²' } },
  { key: 'coordenadas', label: 'Coordenadas', type: 'text', attrs: { placeholder: 'lat,long' } },
  { key: 'notas', label: 'Notas', type: 'text', attrs: { placeholder: 'Notas adicionales' } },
  { key: 'habitaciones', label: 'Habitaciones', type: 'number', attrs: { min: 0, step: 1, placeholder: 'N°' } },
  { key: 'visita', label: 'Fecha/Hora visita', type: 'datetime-local', attrs: {} },
];

let selectedOptionalFields = [];

function renderOptionalFieldsSelector() {
  const selector = document.getElementById('optionalFieldsSelector');
  selector.innerHTML = '';
  OPTIONAL_FIELDS.forEach(field => {
    if (!selectedOptionalFields.includes(field.key)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = field.label;
      btn.className = 'optional-btn';
      btn.onclick = () => {
        selectedOptionalFields.push(field.key);
        renderOptionalFieldsSelector();
        renderOptionalFieldsInputs();
      };
      selector.appendChild(btn);
    }
  });
}

function renderOptionalFieldsInputs(values = {}) {
  const container = document.getElementById('optionalFieldsContainer');
  container.innerHTML = '';
  selectedOptionalFields.forEach(key => {
    const field = OPTIONAL_FIELDS.find(f => f.key === key);
    if (!field) return;
    const group = document.createElement('div');
    group.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = field.label;
    let input;
    if (field.key === 'notas') {
      input = document.createElement('textarea');
      input.rows = 2;
      input.style.resize = 'vertical';
      input.style.width = '100%';
      input.style.boxSizing = 'border-box';
    } else {
      input = document.createElement('input');
      input.type = field.type;
    }
    input.id = key;
    input.name = key;
    Object.entries(field.attrs).forEach(([attr, val]) => input.setAttribute(attr, val));
    if (values[key]) input.value = values[key];
    // Botón para quitar campo
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Quitar';
    removeBtn.className = 'remove-optional-btn';
    removeBtn.onclick = () => {
      selectedOptionalFields = selectedOptionalFields.filter(k => k !== key);
      renderOptionalFieldsSelector();
      renderOptionalFieldsInputs();
    };
    group.appendChild(label);
    group.appendChild(input);
    group.appendChild(removeBtn);
    container.appendChild(group);
  });
}

// Inicializar UI de campos opcionales
renderOptionalFieldsSelector();
renderOptionalFieldsInputs();


// Filtros globales
let filterText = '';
let filterPrecioMin = '';
let filterPrecioMax = '';
let filterStatus = '';
let filterVisita = false;

function filterRentals(rentals) {
  return rentals.filter(rental => {
    // Filtro texto libre (en todos los campos string)
    if (filterText) {
      const txt = filterText.toLowerCase();
      const values = Object.values(rental).join(' ').toLowerCase();
      if (!values.includes(txt)) return false;
    }
    // Filtro precio
    const precio = parseFloat(rental.precio);
    if (filterPrecioMin && precio < parseFloat(filterPrecioMin)) return false;
    if (filterPrecioMax && precio > parseFloat(filterPrecioMax)) return false;
    // Filtro estatus
    if (filterStatus && rental.estatus !== filterStatus) return false;
    // Solo con visita agendada
    if (filterVisita && rental.estatus !== 'Visita agendada') return false;
    return true;
  });
}

// Listeners de filtros
window.addEventListener('DOMContentLoaded', () => {
  const txt = document.getElementById('filterText');
  const min = document.getElementById('filterPrecioMin');
  const max = document.getElementById('filterPrecioMax');
  const status = document.getElementById('filterStatus');
  const visita = document.getElementById('filterVisita');
  if (txt) txt.oninput = e => { filterText = e.target.value; bloc.emit(); };
  if (min) min.oninput = e => { filterPrecioMin = e.target.value; bloc.emit(); };
  if (max) max.oninput = e => { filterPrecioMax = e.target.value; bloc.emit(); };
  if (status) status.onchange = e => { filterStatus = e.target.value; bloc.emit(); };
  if (visita) visita.onchange = e => { filterVisita = e.target.checked; bloc.emit(); };
});

const bloc = new window.RentalBloc();

bloc.subscribe((state) => {
  renderList(state);
  resetForm();
});

function renderList(state) {
  rentalList.innerHTML = '';
  if (!state || !state.rentals) return;
  const filtered = filterRentals(state.rentals);
  filtered.forEach((rental, idx) => {
    const li = document.createElement('li');
    li.className = 'rental-item';
    // Estado de colapso por defecto: colapsado
    let expanded = false;
    // Guardar el estado expandido en el objeto rental temporalmente (no en localStorage)
    if (typeof rental._expanded === 'boolean') expanded = rental._expanded;
    // Título siempre visible
    const header = document.createElement('div');
    header.className = 'rental-header';
    header.style.cursor = 'pointer';
    header.innerHTML = `
      <span class="rental-title">$${rental.precio}</span>
      <span class="rental-dir">${rental.direccion}</span>
      <span class="expand-icon" style="margin-left:auto;font-size:1.1em;user-select:none;">${expanded ? '▼' : '▶'}</span>
    `;
    header.onclick = (e) => {
      // No expandir si se hace click en editar/eliminar
      if (e.target.closest('.rental-actions')) return;
      rental._expanded = !expanded;
      renderList(state);
    };
    li.appendChild(header);
    if (state.editingIndex === idx) {
      // --- Inline edición con campos opcionales y estatus ---
      let editSelectedFields = Object.keys(rental).filter(k => OPTIONAL_FIELDS.some(f => f.key === k));
      const selectorId = `edit-optionalFieldsSelector-${idx}`;
      const containerId = `edit-optionalFieldsContainer-${idx}`;
      let selectorHtml = `<div id="${selectorId}" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;"></div>`;
      let containerHtml = `<div id="${containerId}"></div>`;
      // Opciones de estatus
      const estatusOptions = ['Nuevo','En seguimiento','Visita agendada','Descartado'];
      let estatusHtml = `<div class="form-group"><label>Estatus:</label><select id="edit-estatus-${idx}">`;
      estatusOptions.forEach(opt => {
        estatusHtml += `<option value="${opt}"${rental.estatus===opt?' selected':''}>${opt}</option>`;
      });
      estatusHtml += `</select></div>`;
      li.innerHTML = `
        <form class="inline-edit-form" onsubmit="return false;">
          <input type="number" min="0" value="${rental.precio}" id="edit-precio-${idx}" required style="width:90px;"> 
          <input type="text" value="${rental.direccion}" id="edit-direccion-${idx}" required style="width:120px;">
          <input type="url" value="${rental.facebook || ''}" id="edit-facebook-${idx}" placeholder="Facebook">
          <input type="tel" value="${rental.whatsapp || ''}" id="edit-whatsapp-${idx}" placeholder="WhatsApp">
          ${estatusHtml}
          <div class="form-group">
            <label>Agregar campos opcionales:</label>
            ${selectorHtml}
            ${containerHtml}
          </div>
          <button type="button" id="saveEdit${idx}">Guardar</button>
          <button type="button" id="cancelEdit${idx}">Cancelar</button>
        </form>
      `;
      setTimeout(() => {
        // Renderizar botones de selección de campos opcionales
        const selector = document.getElementById(selectorId);
        selector.innerHTML = '';
        OPTIONAL_FIELDS.forEach(field => {
          if (!editSelectedFields.includes(field.key)) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = field.label;
            btn.className = 'optional-btn';
            btn.onclick = () => {
              editSelectedFields.push(field.key);
              renderEditOptionalFieldsInputs();
              renderEditOptionalFieldsSelector();
            };
            selector.appendChild(btn);
          }
        });
        function renderEditOptionalFieldsSelector() {
          selector.innerHTML = '';
          OPTIONAL_FIELDS.forEach(field => {
            if (!editSelectedFields.includes(field.key)) {
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.textContent = field.label;
              btn.className = 'optional-btn';
              btn.onclick = () => {
                editSelectedFields.push(field.key);
                renderEditOptionalFieldsInputs();
                renderEditOptionalFieldsSelector();
              };
              selector.appendChild(btn);
            }
          });
        }
        function renderEditOptionalFieldsInputs() {
          const container = document.getElementById(containerId);
          container.innerHTML = '';
          editSelectedFields.forEach(key => {
            const field = OPTIONAL_FIELDS.find(f => f.key === key);
            if (!field) return;
            const group = document.createElement('div');
            group.className = 'form-group';
            const label = document.createElement('label');
            label.textContent = field.label;
            let input;
            if (field.key === 'notas') {
              input = document.createElement('textarea');
              input.rows = 2;
              input.style.resize = 'vertical';
              input.style.width = '100%';
              input.style.boxSizing = 'border-box';
            } else {
              input = document.createElement('input');
              input.type = field.type;
            }
            input.id = `edit-${key}-${idx}`;
            input.name = key;
            Object.entries(field.attrs).forEach(([attr, val]) => input.setAttribute(attr, val));
            if (rental[key]) input.value = rental[key];
            // Botón para quitar campo
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = 'Quitar';
            removeBtn.className = 'remove-optional-btn';
            removeBtn.onclick = () => {
              editSelectedFields = editSelectedFields.filter(k => k !== key);
              renderEditOptionalFieldsInputs();
              renderEditOptionalFieldsSelector();
            };
            group.appendChild(label);
            group.appendChild(input);
            group.appendChild(removeBtn);
            container.appendChild(group);
          });
        }
        renderEditOptionalFieldsInputs();
        // Guardar cambios
        document.getElementById(`saveEdit${idx}`).onclick = () => {
          const precio = document.getElementById(`edit-precio-${idx}`).value.trim();
          const direccion = document.getElementById(`edit-direccion-${idx}`).value.trim();
          const facebook = document.getElementById(`edit-facebook-${idx}`).value.trim();
          const whatsapp = document.getElementById(`edit-whatsapp-${idx}`).value.trim();
          const estatus = document.getElementById(`edit-estatus-${idx}`).value;
          let updated = { precio, direccion, estatus };
          if (facebook) updated.facebook = facebook;
          if (whatsapp) updated.whatsapp = whatsapp;
          // Agregar campos opcionales editados
          editSelectedFields.forEach(key => {
            const val = document.getElementById(`edit-${key}-${idx}`).value.trim();
            if (val) updated[key] = val;
            else if (updated[key]) delete updated[key];
          });
          if (!precio || !direccion || (!facebook && !whatsapp)) return;
          bloc.updateRental(idx, updated);
        };
        document.getElementById(`cancelEdit${idx}`).onclick = () => bloc.cancelEdit();
      }, 0);
    } else if (expanded) {
      // ...existing code for detalles...
      let contactoHtml = [];
      if (rental.facebook) {
        contactoHtml.push(`
          <span style="display:inline-flex;align-items:center;gap:2px;">
            <a href="${rental.facebook}" target="_blank">Facebook</a>
            <button type="button" class="copy-btn mini" data-copy="${rental.facebook}" title="Copiar enlace">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="6" y="2" width="8" height="12" rx="2" fill="#fff" stroke="#888" stroke-width="1"/><rect x="4" y="6" width="8" height="12" rx="2" fill="#fff" stroke="#888" stroke-width="1"/></svg>
            </button>
          </span>
        `);
      }
      if (rental.whatsapp) {
        const num = rental.whatsapp.replace(/\D/g, '');
        const waLink = `https://wa.me/${num}`;
        contactoHtml.push(`
          <span style="display:inline-flex;align-items:center;gap:2px;">
            <a href="${waLink}" target="_blank">WhatsApp</a>
            <button type="button" class="copy-btn mini" data-copy="${rental.whatsapp}" title="Copiar número">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="6" y="2" width="8" height="12" rx="2" fill="#fff" stroke="#888" stroke-width="1"/><rect x="4" y="6" width="8" height="12" rx="2" fill="#fff" stroke="#888" stroke-width="1"/></svg>
            </button>
          </span>
        `);
      }
      if (contactoHtml.length === 0) contactoHtml.push('<em>Sin contacto</em>');
      // Mostrar campos opcionales existentes en grid
      let opcionalesGrid = [];
      OPTIONAL_FIELDS.forEach(field => {
        if (rental[field.key]) {
          if (field.key === 'coordenadas') {
            const coords = encodeURIComponent(rental[field.key]);
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords}`;
            opcionalesGrid.push(`<div><strong>${field.label}:</strong> <a href="${mapsUrl}" target="_blank">Maps</a> <button type="button" class="copy-btn mini" data-copy="${rental[field.key]}" title="Copiar coordenadas"><svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="6" y="2" width="8" height="12" rx="2" fill="#fff" stroke="#888" stroke-width="1"/><rect x="4" y="6" width="8" height="12" rx="2" fill="#fff" stroke="#888" stroke-width="1"/></svg></button></div>`);
          } else if (field.key !== 'notas') {
            opcionalesGrid.push(`<div><strong>${field.label}:</strong> ${rental[field.key]}</div>`);
          }
        }
      });
      // Mostrar estatus con color visual
      let estatusHtml = '';
      if (rental.estatus) {
        let color = '#bdbdbd', bg = '#f5f5f5';
        if (rental.estatus === 'Nuevo') { color = '#1976d2'; bg = '#e3f0fd'; }
        else if (rental.estatus === 'En seguimiento') { color = '#f9a825'; bg = '#fff8e1'; }
        else if (rental.estatus === 'Visita agendada') { color = '#388e3c'; bg = '#e8f5e9'; }
        else if (rental.estatus === 'Descartado') { color = '#d32f2f'; bg = '#ffebee'; }
        estatusHtml = `<div><span class="estatus-badge" style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:0.95em;font-weight:500;color:${color};background:${bg};margin-top:2px;">${rental.estatus}</span></div>`;
      }
      const detalles = document.createElement('div');
      detalles.className = 'rental-grid';
      detalles.innerHTML = `
        <div><strong>Contacto:</strong> ${contactoHtml.join(' | ')}</div>
        ${opcionalesGrid.join('')}
        ${estatusHtml}
      `;
      li.appendChild(detalles);
      // Mostrar notas aparte, si existen
      if (rental.notas) {
        const notasDiv = document.createElement('div');
        notasDiv.className = 'rental-notas';
        notasDiv.style.gridColumn = '1/-1';
        notasDiv.style.margin = '8px 0 0 0';
        notasDiv.style.padding = '8px 12px';
        notasDiv.style.background = '#f8f8f8';
        notasDiv.style.borderRadius = '6px';
        notasDiv.style.whiteSpace = 'pre-line';
        notasDiv.innerHTML = `<strong>Notas:</strong><br>${rental.notas}`;
        li.appendChild(notasDiv);
      }
      // Acciones
      const actions = document.createElement('div');
      actions.className = 'rental-actions';
      actions.innerHTML = `
        <button type="button" id="editBtn${idx}">Editar</button>
        <button type="button" id="deleteBtn${idx}">Eliminar</button>
      `;
      li.appendChild(actions);
      setTimeout(() => {
        document.querySelectorAll('.copy-btn').forEach(btn => {
          btn.onclick = () => {
            const val = btn.getAttribute('data-copy');
            if (val) {
              navigator.clipboard.writeText(val);
              btn.title = '¡Copiado!';
              setTimeout(() => btn.title = 'Copiar', 1000);
            }
          };
        });
        document.getElementById(`editBtn${idx}`).onclick = () => bloc.startEdit(idx);
        document.getElementById(`deleteBtn${idx}`).onclick = () => {
          if (confirm('¿Eliminar este alquiler?')) bloc.deleteRental(idx);
        };
      }, 0);
    }
    rentalList.appendChild(li);
  });
}

rentalForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const precio = document.getElementById('precio').value.trim();
  const direccion = document.getElementById('direccion').value.trim();
  const facebook = document.getElementById('facebook').value.trim();
  const whatsapp = document.getElementById('whatsapp').value.trim();
  if (!precio || !direccion || (!facebook && !whatsapp)) return;
  let rental = { precio, direccion };
  if (facebook) rental.facebook = facebook;
  if (whatsapp) rental.whatsapp = whatsapp;
  // Agregar campos opcionales seleccionados
  selectedOptionalFields.forEach(key => {
    const val = document.getElementById(key).value.trim();
    if (val) rental[key] = val;
  });
  // Estatus por defecto
  rental.estatus = 'Nuevo';
  bloc.addRental(rental);
});
