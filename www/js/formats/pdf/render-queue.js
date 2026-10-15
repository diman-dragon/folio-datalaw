// Render scheduler: one pdf.js render at a time, most urgent first; a newer job with the same key replaces the old one.
const jobs = new Map();
let running = null;
export function cancel(key) {
  jobs.delete(key);
  if (running?.key === key) { running.ctl.dead = true; running.ctl.task?.cancel(); }
}
export function clearQueue() {
  jobs.clear();
  if (running) { running.ctl.dead = true; running.ctl.task?.cancel(); }
}
async function pump() {
  if (running || !jobs.size) return;
  let best = null;
  jobs.forEach((j) => { if (!best || j.prio < best.prio) best = j; });
  jobs.delete(best.key);
  running = { key: best.key, ctl: { dead: false, task: null } };
  try { await best.run(running.ctl); } catch { /* cancelled or failed job: its owner retries on the next sync */ }
  running = null;
  setTimeout(pump, 0);
}
// run(ctl) does the whole job; it must store its pdf.js task in ctl.task and re-check ctl.dead after every await.
export function enqueue(key, prio, run) {
  cancel(key);
  jobs.set(key, { key, prio, run });
  pump();
}
