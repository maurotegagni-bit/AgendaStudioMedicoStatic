// --- Storage keys & helpers -------------------------------------------------

const STORAGE_KEYS = {
  doctors: 'asm_doctors',
  treatments: 'asm_treatments',
  appointments: 'asm_appointments',
  history: 'asm_history'
};

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

// --- Domain models (in memoria) ---------------------------------------------

let doctors = loadFromStorage(STORAGE_KEYS.doctors);
let treatments = loadFromStorage(STORAGE_KEYS.treatments);
let appointments = loadFromStorage(STORAGE_KEYS.appointments);
let history = loadFromStorage(STORAGE_KEYS.history);

// --- UI references ----------------------------------------------------------

const doctorForm = document.getElementById('doctor-form');
const doctorListEl = document.getElementById('doctor-list');
const doctorIdEl = document.getElementById('doctor-id');
const doctorFirstNameEl = document.getElementById('doctor-first-name');
const doctorLastNameEl = document.getElementById('doctor-last-name');
const doctorTaxIdEl = document.getElementById('doctor-tax-id');
const doctorPhoneEl = document.getElementById('doctor-phone');
const doctorEmailEl = document.getElementById('doctor-email');
const doctorColorEl = document.getElementById('doctor-color');
const doctorResetBtn = document.getElementById('doctor-reset');

const treatmentForm = document.getElementById('treatment-form');
const treatmentListEl = document.getElementById('treatment-list');
const treatmentIdEl = document.getElementById('treatment-id');
const treatmentNameEl = document.getElementById('treatment-name');
const treatmentDurationEl = document.getElementById('treatment-duration');
const treatmentDoctorIdEl = document.getElementById('treatment-doctor-id');
const treatmentResetBtn = document.getElementById('treatment-reset');

const viewModeEl = document.getElementById('view-mode');
const singleDoctorFilterWrapperEl = document.getElementById('single-doctor-filter-wrapper');
const singleDoctorFilterEl = document.getElementById('single-doctor-filter');
const calendarDateEl = document.getElementById('calendar-date');
const calendarViewEl = document.getElementById('calendar-view');
const newAppointmentBtn = document.getElementById('new-appointment');

const bookingPatientEl = document.getElementById('booking-patient');
const bookingTreatmentIdEl = document.getElementById('booking-treatment-id');
const bookingDoctorIdEl = document.getElementById('booking-doctor-id');
const bookingDateEl = document.getElementById('booking-date');
const bookingFromTimeEl = document.getElementById('booking-from-time');
const bookingToTimeEl = document.getElementById('booking-to-time');
const suggestSlotsBtn = document.getElementById('suggest-slots');
const suggestedSlotsEl = document.getElementById('suggested-slots');

const historyPatientNameEl = document.getElementById('history-patient-name');
const historySearchBtn = document.getElementById('history-search');
const historyListEl = document.getElementById('history-list');

const aiPromptEl = document.getElementById('ai-prompt');
const aiAskBtn = document.getElementById('ai-ask');
const aiAnswerEl = document.getElementById('ai-answer');

// --- Doctor module ----------------------------------------------------------

function renderDoctors() {
  doctorListEl.innerHTML = '';
  treatmentDoctorIdEl.innerHTML = '';
  singleDoctorFilterEl.innerHTML = '<option value="">— Seleziona —</option>';
  bookingDoctorIdEl.innerHTML = '<option value="">— Seleziona —</option>';

  doctors.forEach(doc => {
    // lista laterale
    const li = document.createElement('li');
    li.className = 'list-item';

    const main = document.createElement('div');
    main.className = 'list-item-main';

    const dot = document.createElement('span');
    dot.className = 'color-dot';
    dot.style.backgroundColor = doc.color || '#cccccc';

    const text = document.createElement('span');
    text.textContent = `${doc.firstName} ${doc.lastName}`;

    main.appendChild(dot);
    main.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'list-item-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Modifica';
    editBtn.addEventListener('click', () => fillDoctorForm(doc.id));

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Elimina';
    delBtn.addEventListener('click', () => deleteDoctor(doc.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(main);
    li.appendChild(actions);
    doctorListEl.appendChild(li);

    // select per prestazioni / filtri / prenotazioni
    const opt1 = new Option(`${doc.firstName} ${doc.lastName}`, doc.id);
    treatmentDoctorIdEl.add(opt1);

    const opt2 = new Option(`${doc.firstName} ${doc.lastName}`, doc.id);
    singleDoctorFilterEl.add(opt2);

    const opt3 = new Option(`${doc.firstName} ${doc.lastName}`, doc.id);
    bookingDoctorIdEl.add(opt3);
  });
}

function fillDoctorForm(id) {
  const doc = doctors.find(d => d.id === id);
  if (!doc) return;
  doctorIdEl.value = doc.id;
  doctorFirstNameEl.value = doc.firstName;
  doctorLastNameEl.value = doc.lastName;
  doctorTaxIdEl.value = doc.taxId || '';
  doctorPhoneEl.value = doc.phone || '';
  doctorEmailEl.value = doc.email || '';
  doctorColorEl.value = doc.color || '#4f8ddc';
}

function resetDoctorForm() {
  doctorIdEl.value = '';
  doctorForm.reset();
  doctorColorEl.value = '#4f8ddc';
}

function deleteDoctor(id) {
  if (!confirm('Eliminare questo medico?')) return;
  doctors = doctors.filter(d => d.id !== id);
  saveToStorage(STORAGE_KEYS.doctors, doctors);
  renderDoctors();
  renderTreatments();
  renderCalendar();
}

doctorForm.addEventListener('submit', e => {
  e.preventDefault();
  const id = doctorIdEl.value || generateId('doc');
  const existingIndex = doctors.findIndex(d => d.id === id);

  const doc = {
    id,
    firstName: doctorFirstNameEl.value.trim(),
    lastName: doctorLastNameEl.value.trim(),
    taxId: doctorTaxIdEl.value.trim(),
    phone: doctorPhoneEl.value.trim(),
    email: doctorEmailEl.value.trim(),
    color: doctorColorEl.value || '#4f8ddc'
  };

  if (!doc.firstName || !doc.lastName) {
    alert('Nome e cognome sono obbligatori.');
    return;
  }

  if (existingIndex >= 0) {
    doctors[existingIndex] = doc;
  } else {
    doctors.push(doc);
  }
  saveToStorage(STORAGE_KEYS.doctors, doctors);
  renderDoctors();
  resetDoctorForm();
});

doctorResetBtn.addEventListener('click', e => {
  e.preventDefault();
  resetDoctorForm();
});

// --- Treatment module -------------------------------------------------------

function renderTreatments() {
  treatmentListEl.innerHTML = '';
  bookingTreatmentIdEl.innerHTML = '<option value="">— Seleziona —</option>';

  treatments.forEach(tr => {
    const doc = doctors.find(d => d.id === tr.doctorId);
    const docName = doc ? `${doc.firstName} ${doc.lastName}` : '—';

    const li = document.createElement('li');
    li.className = 'list-item';

    const main = document.createElement('div');
    main.className = 'list-item-main';

    const color = document.createElement('span');
    color.className = 'color-dot';
    color.style.backgroundColor = doc?.color || '#cccccc';

    const text = document.createElement('span');
    text.textContent = `${tr.name} – ${tr.duration} min (${docName})`;

    main.appendChild(color);
    main.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'list-item-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Modifica';
    editBtn.addEventListener('click', () => fillTreatmentForm(tr.id));

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Elimina';
    delBtn.addEventListener('click', () => deleteTreatment(tr.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(main);
    li.appendChild(actions);
    treatmentListEl.appendChild(li);

    const opt = new Option(`${tr.name} – ${tr.duration} min (${docName})`, tr.id);
    bookingTreatmentIdEl.add(opt);
  });
}

function fillTreatmentForm(id) {
  const tr = treatments.find(t => t.id === id);
  if (!tr) return;
  treatmentIdEl.value = tr.id;
  treatmentNameEl.value = tr.name;
  treatmentDurationEl.value = tr.duration;
  treatmentDoctorIdEl.value = tr.doctorId;
}

function resetTreatmentForm() {
  treatmentIdEl.value = '';
  treatmentForm.reset();
}

function deleteTreatment(id) {
  if (!confirm('Eliminare questa prestazione?')) return;
  treatments = treatments.filter(t => t.id !== id);
  saveToStorage(STORAGE_KEYS.treatments, treatments);
  renderTreatments();
}

treatmentForm.addEventListener('submit', e => {
  e.preventDefault();

  const id = treatmentIdEl.value || generateId('tr');
  const existingIndex = treatments.findIndex(t => t.id === id);

  const tr = {
    id,
    name: treatmentNameEl.value.trim(),
    duration: Number(treatmentDurationEl.value),
    doctorId: treatmentDoctorIdEl.value
  };

  if (!tr.name || !tr.duration || !tr.doctorId) {
    alert('Nome, durata e medico sono obbligatori.');
    return;
  }

  if (existingIndex >= 0) {
    treatments[existingIndex] = tr;
  } else {
    treatments.push(tr);
  }
  saveToStorage(STORAGE_KEYS.treatments, treatments);
  renderTreatments();
  resetTreatmentForm();
});

treatmentResetBtn.addEventListener('click', e => {
  e.preventDefault();
  resetTreatmentForm();
});

// --- Appointment & calendar module -----------------------------------------

function getAppointmentsForDate(dateStr) {
  return appointments.filter(a => a.date === dateStr);
}

function renderCalendar() {
  const dateStr = calendarDateEl.value;
  if (!dateStr) {
    calendarViewEl.innerHTML = '<p>Seleziona una data per visualizzare il calendario.</p>';
    return;
  }

  const mode = viewModeEl.value;
  const dailyAppointments = getAppointmentsForDate(dateStr);

  const startMinutes = 8 * 60;
  const endMinutes = 20 * 60;
  const step = 30; // 30 minuti

  calendarViewEl.innerHTML = '';

  for (let m = startMinutes; m < endMinutes; m += step) {
    const timeLabel = toTime(m);
    const row = document.createElement('div');
    row.className = 'calendar-row';

    const timeEl = document.createElement('div');
    timeEl.className = 'calendar-time';
    timeEl.textContent = timeLabel;

    const slotContainer = document.createElement('div');
    slotContainer.className = 'calendar-slots';

    dailyAppointments.forEach(appt => {
      if (!rangeIntersects(m, m + step, timeToMinutes(appt.startTime), timeToMinutes(appt.endTime))) {
        return;
      }

      if (mode === 'single') {
        const selectedDoctorId = singleDoctorFilterEl.value;
        if (selectedDoctorId && appt.doctorId !== selectedDoctorId) {
          return;
        }
      }

      const doctor = doctors.find(d => d.id === appt.doctorId);
      const treatment = treatments.find(t => t.id === appt.treatmentId);

      const slot = document.createElement('div');
      slot.className = 'calendar-slot calendar-slot-appointment';
      slot.style.backgroundColor = doctor?.color || '#4f8ddc';

      const label = `${appt.startTime} ${appt.patient} – ${treatment?.name || ''}`;
      slot.textContent = label;

      slotContainer.appendChild(slot);
    });

    row.appendChild(timeEl);
    row.appendChild(slotContainer);
    calendarViewEl.appendChild(row);
  }
}

function rangeIntersects(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function toTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// --- Slot suggestion algorithm ----------------------------------------------

function suggestFreeSlots({ date, doctorId, duration, fromTime, toTime, maxSlots = 5 }) {
  const dayAppointments = appointments
    .filter(a => a.date === date && a.doctorId === doctorId)
    .map(a => ({
      start: timeToMinutes(a.startTime),
      end: timeToMinutes(a.endTime)
    }))
    .sort((a, b) => a.start - b.start);

  const from = timeToMinutes(fromTime);
  const to = timeToMinutes(toTime);
  const step = 15; // risoluzione di ricerca 15 minuti

  const result = [];
  let t = from;

  while (t + duration <= to && result.length < maxSlots) {
    const candidateStart = t;
    const candidateEnd = t + duration;

    const overlaps = dayAppointments.some(a =>
      rangeIntersects(candidateStart, candidateEnd, a.start, a.end)
    );

    if (!overlaps) {
      result.push({ startTime: toTime(candidateStart), endTime: toTime(candidateEnd) });
    }

    t += step;
  }

  return result;
}

// --- Booking/new appointment flow -------------------------------------------

suggestSlotsBtn.addEventListener('click', () => {
  const patient = bookingPatientEl.value.trim();
  const treatmentId = bookingTreatmentIdEl.value;
  const doctorId = bookingDoctorIdEl.value;
  const date = bookingDateEl.value || calendarDateEl.value;
  const fromTime = bookingFromTimeEl.value || '09:00';
  const toTime = bookingToTimeEl.value || '18:00';

  if (!patient || !treatmentId || !doctorId || !date) {
    alert('Paziente, prestazione, medico e data sono obbligatori per il suggerimento degli slot.');
    return;
  }

  const treatment = treatments.find(t => t.id === treatmentId);
  if (!treatment) {
    alert('Prestazione non trovata.');
    return;
  }

  const slots = suggestFreeSlots({
    date,
    doctorId,
    duration: treatment.duration,
    fromTime,
    toTime,
    maxSlots: 5
  });

  renderSuggestedSlots(slots, { patient, treatmentId, doctorId, date });
});

function renderSuggestedSlots(slots, context) {
  suggestedSlotsEl.innerHTML = '';

  if (!slots.length) {
    suggestedSlotsEl.textContent = 'Nessuno slot libero disponibile nella fascia indicata.';
    return;
  }

  slots.forEach(slot => {
    const div = document.createElement('div');
    div.className = 'slot-item';
    div.innerHTML = `<span>${slot.startTime} – ${slot.endTime}</span>`;

    const btn = document.createElement('button');
    btn.textContent = 'Conferma';
    btn.addEventListener('click', () => {
      createAppointment({
        ...context,
        startTime: slot.startTime,
        endTime: slot.endTime
      });
      suggestedSlotsEl.innerHTML = '';
    });

    div.appendChild(btn);
    suggestedSlotsEl.appendChild(div);
  });
}

function createAppointment({ patient, treatmentId, doctorId, date, startTime, endTime }) {
  const appointment = {
    id: generateId('appt'),
    patient,
    treatmentId,
    doctorId,
    date,
    startTime,
    endTime
  };

  appointments.push(appointment);
  saveToStorage(STORAGE_KEYS.appointments, appointments);

  const treatment = treatments.find(t => t.id === treatmentId);
  history.push({
    id: generateId('hist'),
    patient,
    treatmentId,
    doctorId,
    date,
    startTime,
    endTime,
    treatmentName: treatment?.name || ''
  });
  saveToStorage(STORAGE_KEYS.history, history);

  renderCalendar();
}

// pulsante "Nuova prenotazione": porta il focus sul form e imposta date default
newAppointmentBtn.addEventListener('click', () => {
  bookingPatientEl.focus();
  if (!bookingDateEl.value && calendarDateEl.value) {
    bookingDateEl.value = calendarDateEl.value;
  }
});

// cambi vista / data
viewModeEl.addEventListener('change', () => {
  singleDoctorFilterWrapperEl.style.display =
    viewModeEl.value === 'single' ? 'block' : 'none';
  renderCalendar();
});

singleDoctorFilterEl.addEventListener('change', renderCalendar);
calendarDateEl.addEventListener('change', () => {
  if (!bookingDateEl.value) {
    bookingDateEl.value = calendarDateEl.value;
  }
  renderCalendar();
});

// --- History module ---------------------------------------------------------

historySearchBtn.addEventListener('click', () => {
  const query = historyPatientNameEl.value.trim().toLowerCase();
  historyListEl.innerHTML = '';

  if (!query) {
    return;
  }

  const results = history.filter(h =>
    h.patient.toLowerCase().includes(query)
  );

  if (!results.length) {
    historyListEl.textContent = 'Nessuna prestazione trovata per questo paziente.';
    return;
  }

  results
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .forEach(item => {
      const doctor = doctors.find(d => d.id === item.doctorId);
      const li = document.createElement('li');
      li.className = 'list-item';

      const main = document.createElement('div');
      main.className = 'list-item-main';

      const dot = document.createElement('span');
      dot.className = 'color-dot';
      dot.style.backgroundColor = doctor?.color || '#cccccc';

      const text = document.createElement('span');
      text.textContent = `${item.date} ${item.startTime} – ${item.treatmentName} (${doctor ? doctor.firstName + ' ' + doctor.lastName : '—'})`;

      main.appendChild(dot);
      main.appendChild(text);
      li.appendChild(main);
      historyListEl.appendChild(li);
    });
});

// --- AI assistant stub ------------------------------------------------------

async function callAiStub(prompt) {
  const totalAppointments = appointments.length;
  const distinctDoctors = new Set(appointments.map(a => a.doctorId)).size;

  return (
    'Analisi simulata agenda:\n\n' +
    `• Numero totale di appuntamenti registrati: ${totalAppointments}.\n` +
    `• Numero di medici coinvolti negli appuntamenti: ${distinctDoctors}.\n\n` +
    'Suggerimento organizzativo (generico):\n' +
    '- Distribuisci le prestazioni più lunghe nelle prime ore della giornata.\n' +
    '- Mantieni slot da 10–15 minuti vuoti dopo ogni blocco di 2–3 visite.\n' +
    '- Per urgenze, riserva sempre almeno un blocco di 30 minuti nel pomeriggio.\n\n' +
    'Nota: questa è una risposta statica di esempio. Per integrazione reale con Gemini ' +
    'sarà necessario un backend che chiami le API AI e Google Calendar.'
  );
}

aiAskBtn.addEventListener('click', async () => {
  const prompt = aiPromptEl.value.trim();
  if (!prompt) {
    alert('Inserisci un testo per l’assistente AI.');
    return;
  }

  aiAnswerEl.textContent = 'Sto elaborando...';

  try {
    const answer = await callAiStub(prompt);
    aiAnswerEl.textContent = answer;
  } catch (err) {
    console.error(err);
    aiAnswerEl.textContent = 'Errore durante la generazione della risposta AI (stub).';
  }
});

// --- Init -------------------------------------------------------------------

(function init() {
  const today = new Date().toISOString().slice(0, 10);
  calendarDateEl.value = today;
  bookingDateEl.value = today;
  renderDoctors();
  renderTreatments();
  renderCalendar();
  singleDoctorFilterWrapperEl.style.display =
    viewModeEl.value === 'single' ? 'block' : 'none';
})();
