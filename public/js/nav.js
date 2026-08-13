// Renders the top nav + side nav into #topnav-root / #sidenav-root on every
// page, and centralizes instrument/timeframe selection (persisted in
// localStorage) so switching pages doesn't lose your context.

const TitanNav = (() => {
  const INSTRUMENTS = ["XAUUSD", "EURUSD", "GBPUSD"];
  const TIMEFRAMES = ["H4", "H1", "M15", "M5"];

  const PAGES = [
    { href: "index.html", icon: "CC", label: "Command Center" },
    { href: "validation.html", icon: "VL", label: "Validation Lab" },
    { href: "journal.html", icon: "TJ", label: "Trade Journal" },
    { href: "data-health.html", icon: "DH", label: "Data Health" },
  ];

  function getInstrument() {
    return localStorage.getItem("titan_instrument") || "XAUUSD";
  }
  function getTimeframe() {
    return localStorage.getItem("titan_timeframe") || "M15";
  }
  function setInstrument(v) {
    localStorage.setItem("titan_instrument", v);
    document.dispatchEvent(new CustomEvent("titan:context-change"));
  }
  function setTimeframe(v) {
    localStorage.setItem("titan_timeframe", v);
    document.dispatchEvent(new CustomEvent("titan:context-change"));
  }

  function render(activePage) {
    const topRoot = document.getElementById("topnav-root");
    const sideRoot = document.getElementById("sidenav-root");
    if (!topRoot || !sideRoot) return;

    const instrument = getInstrument();
    const timeframe = getTimeframe();

    topRoot.innerHTML = `
      <nav class="topnav">
        <div class="topnav-left">
          <div class="topnav-title">Titan VSA X</div>
          <select id="instrument-select">
            ${INSTRUMENTS.map((i) => `<option value="${i}" ${i === instrument ? "selected" : ""}>${i}</option>`).join("")}
          </select>
          <select id="timeframe-select">
            ${TIMEFRAMES.map((t) => `<option value="${t}" ${t === timeframe ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </div>
        <div class="topnav-right">
          <span id="backend-status" class="status-pill">checking backend&hellip;</span>
          <button id="analyze-all-btn" class="primary-btn">Analyze All</button>
        </div>
      </nav>
    `;

    sideRoot.innerHTML = `
      <aside class="sidenav">
        ${PAGES.map(
          (p) => `<a href="${p.href}" class="${p.href === activePage ? "active" : ""}">${p.label}</a>`
        ).join("")}
      </aside>
    `;

    document.getElementById("instrument-select").addEventListener("change", (e) => setInstrument(e.target.value));
    document.getElementById("timeframe-select").addEventListener("change", (e) => setTimeframe(e.target.value));
    document.getElementById("analyze-all-btn").addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("titan:analyze-clicked"));
    });

    checkBackend();
  }

  async function checkBackend() {
    const pill = document.getElementById("backend-status");
    if (!pill) return;
    try {
      const res = await fetch(`${window.TITAN_API_BASE}/health`);
      if (res.ok) {
        pill.textContent = "Backend Connected";
        pill.className = "status-pill live";
      } else {
        throw new Error("non-200");
      }
    } catch (_) {
      pill.textContent = "Backend Unreachable";
      pill.className = "status-pill down";
    }
  }

  return { render, getInstrument, getTimeframe, setInstrument, setTimeframe };
})();
