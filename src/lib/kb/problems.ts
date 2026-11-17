// What #4471 actually holds: one entry per problem, each with its own ticket.
// Counts follow the desk's own view (causes.ts, as CauseTable runs it): a report is filed by
// tenant and channel, so `parser` and `hint` split the ticket. The desk's one-day moves
// (desk-notes.json) stay counted where they are filed, and they are a problem of their own too:
// no day/month swap moves a date by one day. That is `shift`, with its own ticket.
import { groupByCause, readAs, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'shift';
export type State = 'fixed' | "won't fix" | 'open';

export const ISSUES_URL = 'https://github.com/prhomhyse/mega-s01e03-what-it-shows/issues';

export const PROBLEMS: Record<Problem, { what: string; issue: number; state: State; why: string }> = {
  parser: { what: 'Shared parser reads day-first dates month first', issue: 1, state: 'fixed', why: 'fix(dates): parse dd/mm for eu locales' },
  hint: { what: 'booking-v3 form hint says MM/DD, the form reads day first', issue: 2, state: "won't fix", why: 'booking-v3 form retired' },
  shift: { what: 'Date lands one day off (time zone), not a day/month swap', issue: 3, state: 'open', why: 'neither fix moves a date by one day' },
};

export type ProblemRow = {
  problem: Problem;
  reports: number;
  alsoIn: Problem[];
  taggedAs: Record<string, number>;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; merged: number; problems: ProblemRow[]; unplaced: number } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const groups = groupByCause(merged, tenantOf);
  const problems: ProblemRow[] = [];
  let unplaced = 0;
  for (const g of groups) {
    if (g.cause === 'unplaced') { unplaced = g.reports.length; continue; }
    problems.push({ problem: g.cause, reports: g.reports.length, alsoIn: readAs(g, oneDayMove) ? ['shift'] : [], taggedAs: g.taggedAs, tenants: g.tenants, firstSeen: g.firstSeen, lastSeen: g.lastSeen });
  }
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    const days = moved.map((r) => r.receivedAt.slice(0, 10)).sort();
    problems.push({
      problem: 'shift',
      reports: moved.length,
      alsoIn: groups.filter((g) => g.cause !== 'unplaced' && readAs(g, oneDayMove)).map((g) => g.cause as Problem),
      taggedAs: moved.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
      tenants: new Set(moved.map((r) => r.tenant)).size,
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
    });
  }
  return { rows: all.filter((r) => r.mergedInto === ticket).length, merged: merged.length, problems, unplaced };
}
