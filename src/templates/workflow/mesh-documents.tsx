import RichEditorBlock from "@/blocks/application/editor";
import "./refinement.css";
const routeBrief = `
<h1>Route Planner Product Brief</h1>
<p>Route Planner helps drivers reorder their stops and prepare for a more predictable day. <strong>@Leo Grant</strong> owns this brief; share questions in <strong>#product-launch</strong>.</p>
<h2>Problem</h2>
<p>A fixed dispatch list cannot account for every traffic delay, closed entrance, or change of plan. Drivers need a clear way to adjust their route without losing the team's shared context.</p>
<blockquote>Make the next stop easier to understand, and give the driver control over changes.</blockquote>
<h2>Goals</h2>
<ul><li>Reduce daily route planning time by <strong>30%</strong>.</li><li>Reach <strong>70% active driver adoption</strong> within a month of general availability.</li><li>Give dispatchers an accurate view of driver changes.</li></ul>
<h2>Scope</h2><h3>In Scope</h3><ul><li>Reorder stops and preview the updated route.</li><li>Keep maps available on older phones and during poor connectivity.</li><li>Explain why a re-route has changed.</li></ul><h3>Out of Scope</h3><p>Fleet-wide capacity forecasting and automated shift scheduling remain separate projects.</p>
<h2>Success Metrics</h2><table><tbody><tr><th>Metric</th><th>Target</th><th>Owner</th></tr><tr><td>Planning time</td><td>30% lower</td><td>Ravi Shah</td></tr><tr><td>Beta cohort</td><td>200 drivers</td><td>Ada Brooks</td></tr><tr><td>Offline support</td><td>Older phones verified</td><td>Nora Vale</td></tr></tbody></table>
<h2>Timeline</h2><p>Beta opens November 4, 2026. General availability follows on November 19 after review of the driver study.</p>
<h2>Decisions</h2><p>Ship behind the route_planner flag and expand the cohort gradually. Record every rollout decision in the project channel.</p>
<h2>Risks</h2><ul><li>Large offline maps can exceed device storage.</li><li>Driver and dispatcher edits can conflict.</li><li>Route explanations must remain clear under time pressure.</li></ul>
<h2>Rollout</h2><p>Nora Vale owns the feature flag. Start with the 200-driver diary study before extending availability to the full fleet.</p>
<h2>Open Questions</h2><ul data-task-list="true"><li><input type="checkbox" contenteditable="false" aria-label="Complete planning measurement"> Agree how planning time is measured with Ravi Shah</li><li><input type="checkbox" contenteditable="false" aria-label="Complete offline map limit"> Set the offline map size limit with Nora Vale and Kai Chen</li><li><input type="checkbox" contenteditable="false" aria-label="Complete override policy"> Decide the dispatcher override policy with operations</li></ul>`;
export function MeshDocuments() {
  return (
    <div className="wf-mesh-document">
      <RichEditorBlock
        initialHtml={routeBrief}
        documentTitle="Route Planner Product Brief"
        block={{
          id: "mesh-document-2",
          name: "Route Planner Product Brief",
          category: "rich-text-editor",
          group: "application",
          reference: "https://mesh-whiteboard.reui.io/documents",
          index: 1,
        }}
      />
    </div>
  );
}
