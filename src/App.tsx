import { useMemo, useState } from "react";
import { recommendPrice, weekCap, cheatSheet } from "./lib/pricing";
import {
  generateSeason,
  playPrice,
  hindsightPrice,
  type WeekDemand,
} from "./lib/simulate";

type Tab = "price" | "practice" | "playbook";

export default function App() {
  const [tab, setTab] = useState<Tab>("price");

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>K-Fashion Desk</h1>
          <div className="sub">IIMT3636 · Dynamic pricing competition</div>
        </div>
      </header>

      <nav className="tabs">
        {(
          [
            ["price", "Price"],
            ["practice", "Practice"],
            ["playbook", "Playbook"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "price" && <PriceTab />}
      {tab === "practice" && <PracticeTab />}
      {tab === "playbook" && <PlaybookTab />}
    </div>
  );
}

/* ───────────────── Price tab ───────────────── */

function PriceTab() {
  const [week, setWeek] = useState(1);
  const [a, setA] = useState(10);
  const [b, setB] = useState(10);
  const [c, setC] = useState(10);
  const [group, setGroup] = useState("1");
  const [soldA, setSoldA] = useState(0);
  const [soldB, setSoldB] = useState(0);
  const [soldC, setSoldC] = useState(0);
  const [log, setLog] = useState<
    { week: number; price: number; sales: [number, number, number]; rev: number }[]
  >([]);
  const [copied, setCopied] = useState(false);

  const rec = useMemo(
    () => recommendPrice(week, [a, b, c]),
    [week, a, b, c]
  );

  const line = `Group ${group} ${rec.price}`;
  const totalRev = log.reduce((s, r) => s + r.rev, 0);

  function copyLine() {
    navigator.clipboard?.writeText(line).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function recordWeek() {
    const sales: [number, number, number] = [
      Math.min(a, Math.max(0, soldA)),
      Math.min(b, Math.max(0, soldB)),
      Math.min(c, Math.max(0, soldC)),
    ];
    const rev = sales[0] * rec.price + sales[1] * rec.price + sales[2] * rec.price;
    setLog((prev) => [...prev, { week, price: rec.price, sales, rev }]);
    setA((x) => x - sales[0]);
    setB((x) => x - sales[1]);
    setC((x) => x - sales[2]);
    setSoldA(0);
    setSoldB(0);
    setSoldC(0);
    if (week < 12) setWeek((w) => w + 1);
  }

  function undo() {
    setLog((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setA((x) => x + last.sales[0]);
      setB((x) => x + last.sales[1]);
      setC((x) => x + last.sales[2]);
      setWeek(last.week);
      return prev.slice(0, -1);
    });
  }

  function reset() {
    setWeek(1);
    setA(10);
    setB(10);
    setC(10);
    setSoldA(0);
    setSoldB(0);
    setSoldC(0);
    setLog([]);
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row">
          <label>
            Week
            <input
              type="number"
              min={1}
              max={12}
              value={week}
              onChange={(e) => setWeek(clamp(Number(e.target.value), 1, 12))}
            />
          </label>
          <label>
            A on hand
            <input
              type="number"
              min={0}
              max={10}
              value={a}
              onChange={(e) => setA(clamp(Number(e.target.value), 0, 10))}
            />
          </label>
          <label>
            B on hand
            <input
              type="number"
              min={0}
              max={10}
              value={b}
              onChange={(e) => setB(clamp(Number(e.target.value), 0, 10))}
            />
          </label>
          <label>
            C on hand
            <input
              type="number"
              min={0}
              max={10}
              value={c}
              onChange={(e) => setC(clamp(Number(e.target.value), 0, 10))}
            />
          </label>
          <label>
            Group no.
            <input
              className="wide"
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="card">
        <div className="muted">Recommended common price</div>
        <div className="price-hero">HK${rec.price}</div>
        <div style={{ marginTop: "0.4rem" }}>
          Safe band <span className="band">HK${rec.band[0]} – {rec.band[1]}</span>
          <span className="muted"> · cap HK${rec.cap}</span>
        </div>
        <p className="muted" style={{ marginTop: "0.55rem" }}>
          {rec.why} Expected sales ≈ {rec.expectedSales}, revenue ≈ HK$
          {rec.expectedRevenue.toLocaleString()}.
        </p>
        <div className="copy-line">
          <span>{line}</span>
          <button className="btn btn-primary" onClick={copyLine}>
            {copied ? "Copied" : "Copy for Mentimeter"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>After the reveal</h3>
        <p className="muted">
          Enter units sold (not ending stock), then record. Inventory and week advance.
        </p>
        <div className="sales-inputs" style={{ marginTop: "0.5rem" }}>
          <label>
            Sold A
            <input
              type="number"
              min={0}
              value={soldA}
              onChange={(e) => setSoldA(Number(e.target.value))}
            />
          </label>
          <label>
            Sold B
            <input
              type="number"
              min={0}
              value={soldB}
              onChange={(e) => setSoldB(Number(e.target.value))}
            />
          </label>
          <label>
            Sold C
            <input
              type="number"
              min={0}
              value={soldC}
              onChange={(e) => setSoldC(Number(e.target.value))}
            />
          </label>
          <button className="btn btn-primary" onClick={recordWeek}>
            Record week
          </button>
          <button className="btn btn-ghost" onClick={undo}>
            Undo
          </button>
          <button className="btn btn-ghost" onClick={reset}>
            Reset season
          </button>
        </div>
        {log.length > 0 && (
          <div style={{ marginTop: "0.85rem" }}>
            <div className="muted">
              Cumulative revenue: <strong>HK${totalRev.toLocaleString()}</strong>
            </div>
            <table style={{ marginTop: "0.4rem" }}>
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Price</th>
                  <th>Sales A/B/C</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {log.map((r) => (
                  <tr key={r.week}>
                    <td>{r.week}</td>
                    <td>{r.price}</td>
                    <td>
                      {r.sales[0]}/{r.sales[1]}/{r.sales[2]}
                    </td>
                    <td>{r.rev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Practice tab ───────────────── */

function PracticeTab() {
  const [seed, setSeed] = useState(() => Date.now() % 1e9);
  const [season, setSeason] = useState<WeekDemand[] | null>(null);
  const [weekIdx, setWeekIdx] = useState(0);
  const [inv, setInv] = useState<[number, number, number]>([10, 10, 10]);
  const [manualPrice, setManualPrice] = useState(750);
  const [phase, setPhase] = useState<"decide" | "reveal" | "done">("decide");
  const [last, setLast] = useState<{
    sales: [number, number, number];
    rev: number;
    hindsight: number;
    hindsightRev: number;
  } | null>(null);
  const [totalRev, setTotalRev] = useState(0);
  const [totalStar, setTotalStar] = useState(0);

  function startNew() {
    const s = generateSeason(seed);
    setSeason(s);
    setWeekIdx(0);
    setInv([10, 10, 10]);
    setPhase("decide");
    setLast(null);
    setTotalRev(0);
    setTotalStar(0);
    const r = recommendPrice(1, [10, 10, 10]);
    setManualPrice(r.price);
  }

  function lockPrice() {
    if (!season) return;
    const d = season[weekIdx];
    const { sales, revenue, newInv } = playPrice(d, manualPrice, inv);
    const hp = hindsightPrice(d, inv);
    const hr = playPrice(d, hp, inv).revenue;
    setLast({ sales, rev: revenue, hindsight: hp, hindsightRev: hr });
    setInv(newInv);
    setTotalRev((x) => x + revenue);
    setTotalStar((x) => x + hr);
    setPhase(weekIdx >= 11 ? "done" : "reveal");
  }

  function nextWeek() {
    if (!season || weekIdx >= 11) {
      setPhase("done");
      return;
    }
    const next = weekIdx + 1;
    setWeekIdx(next);
    const r = recommendPrice(next + 1, inv);
    setManualPrice(r.price);
    setLast(null);
    setPhase("decide");
  }

  function autoFinish() {
    if (!season) return;
    let curInv: [number, number, number] = [...inv];
    let rev = totalRev;
    let star = totalStar;
    for (let w = weekIdx; w < 12; w++) {
      const d = season[w];
      const p =
        w === weekIdx && phase === "decide"
          ? manualPrice
          : recommendPrice(w + 1, curInv).price;
      const played = playPrice(d, p, curInv);
      const hp = hindsightPrice(d, curInv);
      const hr = playPrice(d, hp, curInv).revenue;
      rev += played.revenue;
      star += hr;
      curInv = played.newInv;
    }
    setInv(curInv);
    setTotalRev(rev);
    setTotalStar(star);
    setWeekIdx(11);
    setPhase("done");
    setLast(null);
  }

  const rec =
    season && phase === "decide"
      ? recommendPrice(weekIdx + 1, inv)
      : null;

  return (
    <div className="stack">
      <div className="card">
        <div className="row">
          <label>
            Seed
            <input
              className="wide"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
            />
          </label>
          <button className="btn btn-primary" onClick={startNew}>
            Start season
          </button>
          {season && phase !== "done" && (
            <button className="btn btn-ghost" onClick={autoFinish}>
              Auto-finish with desk
            </button>
          )}
        </div>
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          Practice a full random season. Compare your price to a simple hindsight
          benchmark each week.
        </p>
      </div>

      {!season && (
        <div className="card muted">Press Start season to begin.</div>
      )}

      {season && (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h3>
                Week {weekIdx + 1} / 12{" "}
                <span className="pill">
                  inv {inv[0]}/{inv[1]}/{inv[2]}
                </span>
              </h3>
              <div className="muted">
                Cap HK${weekCap(weekIdx + 1)} · cumulative HK$
                {totalRev.toLocaleString()}
                {totalStar > 0 && (
                  <>
                    {" "}
                    · ratio{" "}
                    <span className="ok">
                      {(totalRev / Math.max(1, totalStar)).toFixed(3)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {phase === "decide" && rec && (
            <div style={{ marginTop: "0.75rem" }}>
              <div className="muted">Desk suggests HK${rec.price}</div>
              <div className="row" style={{ marginTop: "0.4rem" }}>
                <label>
                  Your price
                  <input
                    type="number"
                    min={0}
                    value={manualPrice}
                    onChange={(e) => setManualPrice(Number(e.target.value))}
                  />
                </label>
                <button className="btn btn-primary" onClick={lockPrice}>
                  Lock & reveal
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setManualPrice(rec.price)}
                >
                  Use desk price
                </button>
              </div>
            </div>
          )}

          {phase === "reveal" && last && (
            <div style={{ marginTop: "0.75rem" }}>
              <p>
                Sales {last.sales[0]}/{last.sales[1]}/{last.sales[2]} · revenue
                HK${last.rev}
              </p>
              <p className="muted">
                Hindsight price HK${last.hindsight} would have made HK$
                {last.hindsightRev}
              </p>
              <button className="btn btn-primary" onClick={nextWeek}>
                Next week
              </button>
            </div>
          )}

          {phase === "done" && (
            <div style={{ marginTop: "0.75rem" }}>
              <h3>Season complete</h3>
              <p>
                Your revenue <strong>HK${totalRev.toLocaleString()}</strong>
              </p>
              <p className="muted">
                Hindsight-style benchmark HK${totalStar.toLocaleString()} ·
                ratio{" "}
                <span className="ok">
                  {(totalRev / Math.max(1, totalStar)).toFixed(3)}
                </span>
              </p>
              <p className="muted">
                Note: class scoring uses full-season R* (harder). Aim for ratio
                > 0.90 for full marks.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────── Playbook tab ───────────────── */

function PlaybookTab() {
  const sheet = useMemo(() => cheatSheet(), []);

  const byStock = (stock: number) =>
    sheet.filter((r) => r.stock === stock).map((r) => r.price);

  return (
    <div className="stack">
      <div className="card">
        <h3>1. What the game is</h3>
        <p className="muted">
          12 weeks, three colours (A/B/C), 10 units each, no restock. One common
          integer price per week. Leftover stock at week 12 is worth zero. Visits
          jump in weeks 9–12. Willingness-to-pay falls over the season (cap
          HK$1000 → HK$516).
        </p>
      </div>

      <div className="card">
        <h3>2. How to use the Price tab in class</h3>
        <ol className="muted">
          <li>Set week and on-hand inventory for A, B, C.</li>
          <li>Read the recommended price and copy the Mentimeter line.</li>
          <li>
            Group leader submits once: <code>Group X price</code>.
          </li>
          <li>After reveal, enter units sold and press Record week.</li>
        </ol>
      </div>

      <div className="card">
        <h3>3. Strategy rules of thumb</h3>
        <ul className="muted">
          <li>Early weeks with full stock → price high (roughly 70–85% of cap).</li>
          <li>If one colour is almost gone, still use one common price; the desk balances.</li>
          <li>Weeks 9–12 have double traffic — good time to clear leftover stock.</li>
          <li>Week 12 with stock left → cut aggressively; unsold units earn nothing.</li>
          <li>Never miss the Mentimeter format — wrong/late → instructor sets 999.</li>
        </ul>
      </div>

      <div className="card">
        <h3>4. Backup cheat-sheet (balanced stock only)</h3>
        <p className="muted">
          Use when A=B=C. If colours differ a lot, type real counts into Price.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Cap</th>
                <th>Stock 10</th>
                <th>Stock 6</th>
                <th>Stock 3</th>
                <th>Stock 1</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, i) => {
                const week = i + 1;
                return (
                  <tr key={week}>
                    <td>{week}</td>
                    <td>{weekCap(week)}</td>
                    <td>{byStock(10)[i]}</td>
                    <td>{byStock(6)[i]}</td>
                    <td>{byStock(3)[i]}</td>
                    <td>{byStock(1)[i]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>5. Last year’s Excel</h3>
        <p className="muted">
          The model structure still matches this year’s case (same caps, arrivals,
          inventory). The specific customer WTP columns are one old random draw —
          do not treat them as this year’s demand. Prefer this desk or a fresh
          Monte Carlo.
        </p>
      </div>

      <div className="card">
        <h3>6. Scoring</h3>
        <p className="muted">
          r = R / R* where R* is perfect-information optimum for the realised
          path. r > 0.90 → 10/10; 0.70–0.90 → 9/10. Follow the desk, avoid
          format errors, and clear stock by week 12.
        </p>
      </div>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
