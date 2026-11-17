<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { ISSUES_URL, PROBLEMS, splitTicket } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const tags = (t: Record<string, number>) =>
    Object.entries(t)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
  const intakeMiss = $derived(
    split.groups.reduce((n, g) => n + g.reports.filter((r) => r.meta.intakeTag !== g.problem).length, 0),
  );
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports in #{ticket} ({split.rows - split.merged.length} export duplicates removed) ·
  <strong>{split.groups.length}</strong> {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>ticket</th><th>tenants</th><th>seen</th><th>intake tagged as</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      {@const p = g.problem === 'unplaced' ? null : PROBLEMS[g.problem]}
      <tr class:wrong={!p}>
        <td><code>{g.problem}</code><br /><span class="what">{p?.what ?? 'no tenant on file'}</span></td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{#if p}<a href="{ISSUES_URL}/{p.issue}">#{p.issue}</a>{:else}none{/if}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td class="tags">{tags(g.taggedAs)}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">Intake's tag disagrees with the problem on {intakeMiss} of {split.merged.length} reports: it guessed from the reporter's browser, not the tenant.</p>

<style>
  .sum { font-size: 1.1rem; }
  .what, .tags, .note { color: var(--muted); font-size: 0.85em; }
  .wrong td { background: var(--warn-bg); }
</style>
