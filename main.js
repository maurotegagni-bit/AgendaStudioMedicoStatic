// Gestione agenda con localStorage

const STORAGE_KEY = 'agendaStudioMedicoAppointments';

function loadAppointments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAppointments(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderAppointments() {
  const listEl = document.getElementById('appointments-list');
  listEl.innerHTML = '';

  const appointments = loadAppointments();
  appointments
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .forEach((appt, index) => {
      const li = document.createElement('li');
      li.className = 'appointment-item';

      const info = document.createElement('div');
      info.className = 'appointment-info';
      info.textContent = `${appt.date} ${appt.time} – ${appt.patient} (${appt.note || 'senza note'})`;

      const actions = document.createElement('div');
      actions.className = 'appointment-actions';

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Elimina';
      delBtn.addEventListener('click', () => {
        const current = loadAppointments();
        current.splice(index, 1);
        saveAppointments(current);
        renderAppointments();
      });

      actions.appendChild(delBtn);
      li.appendChild(info);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
}

document.getElementById('add-appointment').addEventListener('click', () => {
  const date = document.getElementById('date-input').value;
  const time = document.getElementById('time-input').value;
  const patient = document.getElementById('patient-input').value.trim();
  const note = document.getElementById('note-input').value.trim();

  if (!date || !time || !patient) {
    alert('Data, ora e paziente sono obbligatori.');
    return;
  }

  const appointments = loadAppointments();
  appointments.push({ date, time, patient, note });
  saveAppointments(appointments);
  renderAppointments();

  document.getElementById('patient-input').value = '';
  document.getElementById('note-input').value = '';
});

renderAppointments();

// Stub assistente AI: da collegare al backend Gemini

async function callGemini(prompt) {
  // QUI, in futuro, chiamerai il tuo backend che usa Gemini.
  // Per ora restituiamo una risposta simulata.
  return (
    'Risposta simulata AI:\n\n' +
    'Hai richiesto supporto su: "' + prompt + '".\n' +
    'Suggerimento: assegna gli appuntamenti urgenti nelle prime ore, ' +
    'raggruppa i controlli in fasce orarie omogenee e prevedi margini ' +
    'di 10–15 minuti tra visite ad alto rischio di ritardo.'
  );
}

document.getElementById('ask-ai').addEventListener('click', async () => {
  const promptEl = document.getElementById('prompt');
  const responseEl = document.getElementById('ai-response');
  const prompt = promptEl.value.trim();

  if (!prompt) {
    alert('Inserisci una domanda o descrizione per l’assistente AI.');
    return;
  }

  responseEl.textContent = 'Sto elaborando la risposta...';

  try {
    const reply = await callGemini(prompt);
    responseEl.textContent = reply;
  } catch (err) {
    console.error(err);
    responseEl.textContent = 'Errore durante la richiesta all’assistente AI.';
  }
});
