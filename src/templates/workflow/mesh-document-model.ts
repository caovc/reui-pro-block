export type MeshDocument = { id: string; title: string; html: string; updated: string };
export type DocumentStore = {
  documents: MeshDocument[];
  active: string;
  fullWidth: boolean;
  smallText: boolean;
};
export const documentStorageKey = "bricklane:mesh:documents:v1";

const routeBrief = `
<h1>Route Planner Product Brief</h1>
<p>Route Planner helps drivers reorder their stops and prepare for a more predictable day. <span data-type="mention" data-id="Leo Grant" data-label="Leo Grant"></span> owns this brief; share questions in <code>#product-launch</code>.</p>
<nav data-type="contents"></nav>
<h2>Problem</h2>
<p>A fixed dispatch list cannot account for every traffic delay, closed entrance, or change of plan. Drivers need a clear way to adjust their route without losing the team's shared context.</p>
<blockquote>Make the next stop easier to understand, and give the driver control over changes.</blockquote>
<h2>Goals</h2>
<ul>
<li>Reduce daily route planning time by <strong>30%</strong>.</li>
<li>Reach <strong>70% active driver adoption</strong> within a month of general availability.</li>
<li>Give dispatchers an accurate view of driver changes.</li>
</ul>
<h2>Scope</h2>
<h3>In Scope</h3>
<ul>
<li>Reorder stops and preview the updated route.</li>
<li>Keep maps available on older phones and during poor connectivity.</li>
<li>Explain why a re-route has changed.</li>
</ul>
<h3>Out of Scope</h3>
<p>Fleet-wide capacity forecasting and automated shift scheduling remain separate projects.</p>
<h2>Success Metrics</h2>
<table>
<tbody>
<tr>
<th>Metric</th>
<th>Target</th>
<th>Owner</th>
</tr>
<tr>
<td>Planning time</td>
<td>30% lower</td>
<td>Ravi Shah</td>
</tr>
<tr>
<td>Beta cohort</td>
<td>200 drivers</td>
<td>Ada Brooks</td>
</tr>
<tr>
<td>Offline support</td>
<td>Older phones verified</td>
<td>Nora Vale</td>
</tr>
</tbody>
</table>
<h2>Timeline</h2>
<p>Beta opens November 4, 2026. General availability follows on November 19 after review of the driver study.</p>
<h2>Decisions</h2>
<p>Ship behind the route_planner flag and expand the cohort gradually. Record every rollout decision in the project channel.</p>
<pre><code>route_planner: {
  enabled: true,
  cohort: "driver-beta",
  owner: "Nora Vale"
}</code></pre>
<h2>Risks</h2>
<ul>
<li>Large offline maps can exceed device storage.</li>
<li>Driver and dispatcher edits can conflict.</li>
<li>Route explanations must remain clear under time pressure.</li>
</ul>
<h2>Rollout</h2>
<p>Nora Vale owns the feature flag. Start with the 200-driver diary study before extending availability to the full fleet.</p>
<h2>Open Questions</h2>
<ul data-task-list="true">
<li>
<input type="checkbox" contenteditable="false" aria-label="Complete planning measurement"> Agree how planning time is measured with Ravi Shah</li>
<li>
<input type="checkbox" contenteditable="false" aria-label="Complete offline map limit"> Set the offline map size limit with Nora Vale and Kai Chen</li>
<li>
<input type="checkbox" contenteditable="false" aria-label="Complete override policy"> Decide the dispatcher override policy with operations</li>
</ul>`;

const seeds = [
  ["DOC-1", "Route Planner Product Brief", routeBrief],
  [
    "DOC-2",
    "Design Crit Meeting Notes",
    `
<h1>Design Crit Meeting Notes</h1>
<p>Review the driver experience together. Capture decisions and assign the follow-up work.</p>
<h2>Agenda</h2>
<ul>
<li>Stop reordering and updated arrival times</li>
<li>Explain live route changes</li>
<li>Offline map storage limits</li>
</ul>
<h2>Decisions</h2>
<p>Show the driver why an arrival time changed. Keep a clear way to undo a reorder.</p>
<h2>Actions</h2>
<ul data-task-list='true'>
<li>
<input type='checkbox' contenteditable='false' aria-label='Review stop list'> Review the stop list with Mira</li>
<li>
<input type='checkbox' contenteditable='false' aria-label='Test offline states'> Test offline states with Nora</li>
</ul>
`,
  ],
  [
    "DOC-3",
    "Driver Research Synthesis",
    `
<h1>Driver Research Synthesis</h1>
<p>Observations from the Route Planner driver interviews.</p>
<h2>Research Questions</h2>
<ul>
<li>When do drivers change their plan?</li>
<li>Which information helps them trust a reroute?</li>
</ul>
<h2>Findings</h2>
<p>Drivers need control over stop order and a clear explanation of route changes.</p>
<blockquote>Make the reason for a change visible before asking a driver to accept it.</blockquote>
<h2>Next Steps</h2>
<p>Validate the flow with the beta cohort and record planning time.</p>
`,
  ],
  [
    "DOC-4",
    "Sprint 14 Retrospective Summary",
    `
<h1>Sprint 14 Retrospective Summary</h1>
<p>A review of how the team worked and what we will change next sprint.</p>
<h2>What Went Well</h2>
<ul>
<li>Design and engineering reviewed the stop list together.</li>
<li>Early feedback identified an offline storage risk.</li>
</ul>
<h2>What Could Improve</h2>
<p>Bring operations into the review before finalizing override rules.</p>
<h2>Actions</h2>
<ul data-task-list='true'>
<li>
<input type='checkbox' contenteditable='false' aria-label='Book review'> Book the next cross-team review</li>
</ul>
`,
  ],
  [
    "DOC-5",
    "Route Planner Launch Plan",
    `
<h1>Route Planner Launch Plan</h1>
<p>Prepare the beta and general availability rollout.</p>
<h2>Beta</h2>
<p>Invite 200 drivers on November 4, 2026 and measure planning time.</p>
<h2>Readiness Checklist</h2>
<ul data-task-list='true'>
<li>
<input type='checkbox' contenteditable='false' aria-label='Verify offline maps'> Verify offline maps</li>
<li>
<input type='checkbox' contenteditable='false' aria-label='Publish help articles'> Publish help articles</li>
<li>
<input type='checkbox' contenteditable='false' aria-label='Agree rollback plan'> Agree the rollback plan</li>
</ul>
<h2>General Availability</h2>
<p>Review beta feedback before the November 19 launch.</p>
`,
  ],
];

export function initialDocumentStore(): DocumentStore {
  return {
    documents: seeds.map(([id, title, html]) => ({
      id,
      title,
      html,
      updated: "2026-10-26T00:00:00.000Z",
    })),
    active: "DOC-1",
    fullWidth: false,
    smallText: false,
  };
}

export function escapeDocumentText(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char,
  );
}

export function readDocumentStore(): DocumentStore {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(documentStorageKey) || "null",
    ) as DocumentStore | null;
    if (
      parsed &&
      Array.isArray(parsed.documents) &&
      parsed.documents.length > 0 &&
      new Set(parsed.documents.map((doc) => doc?.id)).size === parsed.documents.length &&
      parsed.documents.every(
        (doc) =>
          doc !== null &&
          typeof doc === "object" &&
          typeof doc.id === "string" &&
          doc.id.length > 0 &&
          typeof doc.title === "string" &&
          doc.title.length <= 200 &&
          typeof doc.html === "string" &&
          doc.html.length <= 1000000,
      )
    ) {
      const requested = new URLSearchParams(location.search).get("doc");
      const active = requested || parsed.active;
      return {
        documents: parsed.documents.map((doc) => ({
          ...doc,
          updated: typeof doc.updated === "string" ? doc.updated : "2026-10-26T00:00:00.000Z",
        })),
        active: parsed.documents.some((doc) => doc.id === active) ? active : parsed.documents[0].id,
        fullWidth: Boolean(parsed.fullWidth),
        smallText: Boolean(parsed.smallText),
      };
    }
  } catch {
    /* Start with local example documents if storage is unavailable. */
  }
  const initial = initialDocumentStore();
  const requested =
    typeof location === "undefined" ? null : new URLSearchParams(location.search).get("doc");
  return initial.documents.some((doc) => doc.id === requested)
    ? { ...initial, active: requested! }
    : initial;
}

export const documentTemplates = [
  {
    title: "Product brief",
    html: `
<h2>Problem</h2>
<p>Describe the problem and who experiences it.</p>
<h2>Goals</h2>
<ul>
<li>Define a measurable outcome.</li>
</ul>
<h2>Scope</h2>
<p>What belongs in this release?</p>
<h2>Success Metrics</h2>
<table>
<tbody>
<tr>
<th>Metric</th>
<th>Target</th>
</tr>
<tr>
<td>Metric name</td>
<td>Target value</td>
</tr>
</tbody>
</table>
<h2>Open Questions</h2>
<p>What do we need to learn?</p>
`,
  },
  {
    title: "Meeting notes",
    html: `
<h2>Agenda</h2>
<ul>
<li>Discussion topic</li>
</ul>
<h2>Notes</h2>
<p>Capture the discussion here.</p>
<h2>Decisions</h2>
<p>Record what we agreed.</p>
<h2>Actions</h2>
<ul data-task-list='true'>
<li>
<input type='checkbox' contenteditable='false' aria-label='Complete action'> Add an owner and a due date</li>
</ul>
`,
  },
  {
    title: "Research synthesis",
    html: `
<h2>Research Questions</h2>
<p>What do we want to learn?</p>
<h2>Findings</h2>
<p>Summarize evidence from the research.</p>
<h2>Recommendations</h2>
<p>What should change?</p>
`,
  },
  {
    title: "Retrospective",
    html: `
<h2>What Went Well</h2>
<p>Celebrate what helped.</p>
<h2>What Could Improve</h2>
<p>Describe a specific improvement.</p>
<h2>Actions</h2>
<p>Agree on an owner for each action.</p>
`,
  },
  {
    title: "Launch plan",
    html: `
<h2>Milestones</h2>
<p>Define the beta and launch dates.</p>
<h2>Readiness Checklist</h2>
<ul data-task-list='true'>
<li>
<input type='checkbox' contenteditable='false' aria-label='Review launch readiness'> Review launch readiness</li>
</ul>
<h2>Rollback Plan</h2>
<p>Define when and how to roll back.</p>
`,
  },
];
