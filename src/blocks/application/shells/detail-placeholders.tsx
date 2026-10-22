import { Frame, FramePanel, FrameFooter } from "@/components/reui/frame";
/** The public shell examples deliberately show empty content. These layouts mirror
 * their visible placeholder geometry; they do not fabricate operational data. */
function Line({
  width,
  height,
  className = "",
}: {
  width?: string | number;
  height?: number;
  className?: string;
}) {
  return (
    <span
      className={`fidelity-placeholder ${className}`}
      style={{ width, height }}
    />
  );
}
function FleetRow({ expanded = false }: { expanded?: boolean }) {
  return (
    <div className={`fleet-placeholder-row ${expanded ? "expanded" : ""}`}>
      <div className="fleet-placeholder-row-top">
        <div className="fleet-placeholder-identity">
          <Line width={12} height={42} />
          <div>
            <Line width={76} />
            <Line width={144} />
          </div>
        </div>
        <div className="fleet-placeholder-values">
          {[92, 54, 48, 64].map((w, i) => (
            <div key={i}>
              <Line width={w} />
              <Line width={w} />
            </div>
          ))}
        </div>
        <div className="fleet-placeholder-actions">
          <Line width={24} height={24} />
          <Line width={24} height={24} />
        </div>
      </div>
      <Line width={200} height={18} />
      {expanded && (
        <>
          <div className="fleet-placeholder-expanded">
            <Line />
            <Line />
          </div>
          <Line width={240} height={24} />
        </>
      )}
    </div>
  );
}
export function FleetPlaceholders() {
  return (
    <div className="fleet-placeholder-canvas" aria-hidden="true">
      <div className="fleet-placeholder-summaries">
        {[0, 1, 2].map((v) => (
          <Frame className="fleet-placeholder-summary" key={v}>
            <FramePanel className="fleet-placeholder-summary-body">
              <div>
                <Line width={28} height={28} />
                <Line width={v === 1 ? 80 : 94} height={20} />
              </div>
              <div>
                <Line width={v === 2 ? 46 : 40} height={24} />
                <Line width={104} />
              </div>
            </FramePanel>
            <FrameFooter>
              <Line width="38%" height={20} />
              <Line width="42%" height={20} />
            </FrameFooter>
          </Frame>
        ))}
      </div>
      <div className="fleet-placeholder-table">
        <header>
          <Line width={110} height={20} />
          <div>
            <Line width={94} height={28} />
            <Line width={56} height={28} />
            <Line width={28} height={28} />
          </div>
        </header>
        <section>
          <div className="fleet-placeholder-toolbar">
            <Line width="34%" height={24} />
            <Line width="30%" height={24} />
          </div>
          <FleetRow />
          <div className="fleet-placeholder-open">
            <FleetRow expanded />
            <footer>
              <Line width="30%" />
              <Line width="42%" height={28} />
            </footer>
          </div>
          <FleetRow />
          <FleetRow />
          <FleetRow />
        </section>
      </div>
    </div>
  );
}
export function InvoicePlaceholders() {
  return (
    <div className="invoice-placeholder-canvas" aria-hidden="true">
      <section className="invoice-placeholder-focus">
        <Line width={200} height={20} />
        <div className="invoice-placeholder-form">
          <div className="invoice-placeholder-detail">
            <div className="invoice-placeholder-heading">
              <Line width={34} height={34} />
              <div>
                <Line width={112} />
                <Line width={96} height={12} />
              </div>
              <Line width={80} height={18} />
            </div>
            <Line height={28} />
            <div className="invoice-placeholder-columns">
              <div>
                {[0, 1, 2, 3, 4, 5].map((v) => (
                  <div className="invoice-placeholder-field" key={v}>
                    <Line width={`${[22, 33, 28, 30, 24, 30][v]}%`} />
                    <Line width={`${v === 1 ? 58 : v === 4 ? 30 : 25}%`} />
                  </div>
                ))}
              </div>
              <div className="invoice-placeholder-docs">
                <Line width={96} />
                {[0, 1].map((v) => (
                  <div key={v}>
                    <Line width="74%" />
                    <Line />
                    <Line width="50%" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="invoice-placeholder-preview">
            <Line width="50%" height={20} />
            <div>
              <Line width="35%" />
              <Line />
              <Line width="75%" />
              <hr />
              <Line width="42%" />
              <Line width="88%" />
              <Line
                className="invoice-placeholder-stamp"
                width="65%"
                height={12}
              />
              <Line height={28} />
            </div>
          </aside>
        </div>
        <Line width="54%" />
      </section>
      <section className="invoice-placeholder-grid">
        <div className="invoice-placeholder-summary-row">
          {[0, 1, 2].map((v) => (
            <div key={v}>
              <div>
                <Line width="28%" />
                <Line width="14%" />
              </div>
              <div>
                <Line width="31%" />
                <Line width="25%" />
              </div>
              <footer>
                <Line width="20%" />
                <Line width="18%" />
                <Line width="12%" />
                <Line width="24%" />
              </footer>
            </div>
          ))}
        </div>
        <div className="invoice-placeholder-table">
          <header>
            <Line width="27%" height={24} />
            <Line width="36%" height={24} />
          </header>
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className={i === 6 ? "flagged" : ""}>
              <span>
                <Line width={14} />
                <Line width={`${[44, 64, 72, 62][i % 4]}%`} />
              </span>
              <span>
                <Line width="35%" />
              </span>
              <span>
                <Line width="15%" />
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
