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
</script>

<p class="sum">
  <strong>{split.merged}</strong> reports in #{ticket} ({split.rows - split.merged} export duplicates removed) ·
  <strong>{split.problems.length}</strong> {split.problems.length === 1 ? 'problem' : 'problems'}
  {#if split.unplaced} · {split.unplaced} with no tenant on file{/if}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>ticket</th><th>state</th><th>tenants</th><th>seen</th><th>intake tagged as</th></tr>
  </thead>
  <tbody>
    {#each split.problems as p (p.problem)}
      {@const info = PROBLEMS[p.problem]}
      <tr class:open={info.state === 'open'}>
        <td><code>{p.problem}</code><br /><span class="what">{info.what}</span></td>
        <td><strong>{p.reports}</strong></td>
        <td><a href="{ISSUES_URL}/{info.issue}">#{info.issue}</a></td>
        <td><b class="state">{info.state}</b><br /><span class="what">{info.why}</span></td>
        <td>{p.tenants}</td>
        <td>{p.firstSeen} → {p.lastSeen}</td>
        <td class="tags">{tags(p.taggedAs)}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each split.problems.filter((p) => p.problem === 'shift') as s (s.problem)}
  <p class="note">The {s.reports} <code>shift</code> reports are counted where the desk files them too ({s.alsoIn.map((c) => `#${PROBLEMS[c].issue} ${c}`).join(', ')}), so the rows add up to more than {split.merged}.</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .what, .tags, .note { color: var(--muted); font-size: 0.85em; }
  .open td { background: var(--warn-bg); }
  .open .state { color: var(--warn); }
</style>
