export const schoolTimeZone = 'America/New_York';

export function schoolDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: schoolTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function isInSchoolMonth(start, end, now = new Date()) {
  const month = schoolDate(now).slice(0, 7);
  return start.slice(0, 7) <= month && end.slice(0, 7) >= month;
}

export function orderDeadline(year, month) {
  const first = new Date(Date.UTC(year, month, 1, 12));
  const firstFriday = 1 + (5 - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, firstFriday - 2, 12));
}

export function orderDeadlineText(now = new Date()) {
  const [year, month] = schoolDate(now).split('-').map(Number);
  const deadline = orderDeadline(year, month - 1);
  const format = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: schoolTimeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const passed = `${schoolDate(now)}T${time}` >= `${deadline.toISOString().slice(0, 10)}T09:00`;
  return `The deadline ${passed ? 'was' : 'is'} ${format.format(deadline)} at 9 a.m. (Ohio time).`;
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-oia-order-deadline]').forEach((note) => { note.textContent = orderDeadlineText(); });
  document.querySelectorAll('[data-oia-monthly-events]').forEach((section) => {
    const events = [...section.querySelectorAll('[data-start][data-end]')];
    events.forEach((event) => { event.hidden = !isInSchoolMonth(event.dataset.start, event.dataset.end); });
    const empty = section.querySelector('.oia-events-empty');
    if (empty) empty.hidden = events.some((event) => !event.hidden);
  });
  document.querySelectorAll('[data-open-event]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.openEvent);
      dialog.showModal();
      const chart = dialog.querySelector('iframe[data-src]');
      if (chart) {
        chart.src = chart.dataset.src;
        chart.removeAttribute('data-src');
      }
    });
  });
  document.querySelectorAll('[data-close-event]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
}
