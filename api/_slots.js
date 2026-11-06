/* ============================================================
   _slots.js — regras de horário no servidor.

   Espelha slotAvailability() de assets/js/store.js. A tela continua
   calculando a grade para exibir, mas quem decide se um agendamento pode
   nascer é este arquivo mais a chave primária de appointment_slots: um
   cliente que adultere o JavaScript não contorna nenhum dos dois.
   ============================================================ */

'use strict';

const SLOT = 30;

const timeToMin = (t) => {
  const m = /^(\d{2}):(\d{2})$/.exec(String(t || ''));
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
};

const minToTime = (v) =>
  String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');

/** Quantos slots de 30 min um serviço ocupa. 45 min ocupa 2. */
const slotsNeeded = (duration) => Math.max(1, Math.ceil(Number(duration) / SLOT));

const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

/** Dia da semana (0 = domingo) lido como data local, sem passar por UTC. */
function weekdayOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** "Agora" no fuso da barbearia, independente do fuso do servidor. */
function nowInShopTz() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date()).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});

  return {
    iso: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute)
  };
}

/**
 * Valida data, hora e duração contra os ajustes da barbearia.
 * Devolve { ok: true, times: ['15:00','15:30'] } ou { ok: false, error }.
 */
function validateBooking(settings, iso, time, duration) {
  if (!isIsoDate(iso)) return { ok: false, error: 'Data inválida.' };

  const start = timeToMin(time);
  if (start === null) return { ok: false, error: 'Horário inválido.' };

  const need = slotsNeeded(duration);
  const open = timeToMin(settings.openTime) ?? 10 * 60;
  const close = timeToMin(settings.closeTime) ?? 19 * 60;

  if ((settings.closedWeekdays || []).indexOf(weekdayOf(iso)) !== -1) {
    return { ok: false, error: 'A barbearia está fechada nesse dia.' };
  }
  if (start < open) return { ok: false, error: 'Horário antes da abertura.' };
  if ((start - open) % SLOT !== 0) return { ok: false, error: 'Horário fora da grade.' };
  if (start + need * SLOT > close) {
    return { ok: false, error: 'Não há tempo até o fechamento para esse serviço.' };
  }

  const now = nowInShopTz();
  if (iso < now.iso || (iso === now.iso && start <= now.minutes)) {
    return { ok: false, error: 'Esse horário já passou.' };
  }

  const times = [];
  for (let i = 0; i < need; i++) times.push(minToTime(start + i * SLOT));
  return { ok: true, times: times };
}

module.exports = { SLOT, slotsNeeded, timeToMin, minToTime, isIsoDate, validateBooking };
