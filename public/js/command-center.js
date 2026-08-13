TitanNav.render("index.html");

const els = {
  loading: document.getElementById("loading-banner"),
  error: document.getElementById("error-banner"),
  content: document.getElementById("content"),
  empty: document.getElementById("empty-state"),
};

function setLoading(isLoading) {
  els.loading.style.display = isLoading ? "block" : "none";
  document.getElementById("analyze-all-btn").disabled = isLoading;
}

function showError(message) {
  els.error.style.display = "flex";
  els.error.textContent = message;
  els.content.style.display = "none";
  els.empty.style.display = "none";
}

function clearError() {
  els.error.style.display = "none";
}

function badgeClass(status) {
  return (status || "").toLowerCase();
}

function fmtPct(v) {
  return v === null || v === undefined ? "&mdash;" : `${v}%`;
}

function fmtNum(v, decimals = 2) {
  return v === null || v === undefined ? "&mdash;" : Number(v).toFixed(decimals);
}

function directionColorClass(direction) {
  if (direction === "BULLISH") return "bullish";
  if (direction === "BEARISH") return "bearish";
  return "neutral";
}

function renderTradePlan(final, risk) {
  const body = document.getElementById("trade-plan-body");

  if (final.status !== "VALIDATED" || final.entry === null) {
    body.innerHTML = `
      <div style="padding:24px; text-align:center; color:var(--on-surface-variant); font-size:13px;">
        No trade plan &mdash; status is <strong>${final.status}</strong>.<br/>
        ${risk && risk.reason ? risk.reason : "Confidence or tradeability threshold not met."}
      </div>`;
    return;
  }

  body.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface); border-radius:4px;">
      <span class="label-caps">Entry</span>
      <span class="data-mono" style="font-size:17px;">${fmtNum(final.entry)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(220,38,38,0.08); border:1px solid rgba(220,38,38,0.25); border-radius:4px;">
      <span class="label-caps bearish">Stop Loss</span>
      <span class="data-mono bearish" style="font-size:17px;">${fmtNum(final.stop)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(22,163,74,0.08); border:1px solid rgba(22,163,74,0.25); border-radius:4px;">
      <span class="label-caps bullish">Target</span>
      <span class="data-mono bullish" style="font-size:17px;">${fmtNum(final.target)}</span>
    </div>`;
}

function renderEngineTable(engines) {
  const body = document.getElementById("engine-table-body");
  const rows = engines.map((r) => {
    const status = r.validation_status || "N/A"; // filled below from fusion report
    return r;
  });
  body.innerHTML = engines
    .map((r) => {
      const dirClass = directionColorClass(r.direction);
      const quality = (r.data_quality || "medium").toLowerCase();
      return `
        <tr>
          <td>${r.engine}</td>
          <td class="${dirClass}">${r.direction || "&mdash;"}</td>
          <td class="numeric">${r.directional_contribution ?? "&mdash;"}</td>
          <td><span class="badge ${badgeClass(r.validation_status)}">${r.validation_status || "N/A"}</span></td>
          <td><span class="badge ${quality}">${(r.data_quality || "N/A").toUpperCase()}</span></td>
        </tr>`;
    })
    .join("");
  document.getElementById("active-nodes-count").textContent = `${engines.length} NODES`;
}

async function runAnalysis() {
  const instrument = TitanNav.getInstrument();
  const timeframe = TitanNav.getTimeframe();

  clearError();
  setLoading(true);
  els.empty.style.display = "none";

  try {
    const result = await Titan.getAnalysis(instrument, timeframe);

    if (result.status === "DATA_UNAVAILABLE") {
      showError(`Data unavailable: ${result.error}. Check TWELVE_DATA_API_KEY on the backend, or that a fallback source is reachable.`);
      return;
    }

    els.content.style.display = "grid";
    document.getElementById("page-title").innerHTML = `${instrument} <span style="color:var(--on-surface-variant); font-weight:400;">/ ${timeframe}</span>`;
    document.getElementById("page-price").textContent = fmtNum(result.market.price, instrument === "XAUUSD" ? 2 : 5);

    const final = result.final;
    const dirClass = directionColorClass(final.direction);
    document.getElementById("verdict-direction").textContent = final.direction;
    document.getElementById("verdict-direction").className = `headline-lg ${dirClass}`;
    document.getElementById("verdict-strength").textContent = fmtNum(final.directional_strength, 1);
    document.getElementById("verdict-confidence").textContent = fmtPct(final.confidence_percent);
    document.getElementById("verdict-tradeability").textContent = fmtPct(final.tradeability_percent);
    document.getElementById("confidence-bar").style.width = `${final.confidence_percent || 0}%`;
    document.getElementById("tradeability-bar").style.width = `${final.tradeability_percent || 0}%`;

    document.getElementById("status-pill-wrap").innerHTML =
      `<div class="status-pill ${final.status === "VALIDATED" ? "live" : final.status === "NO_TRADE" ? "down" : ""}">${final.status}</div>`;

    document.getElementById("verdict-rr").textContent = result.risk && result.risk.rr ? fmtNum(result.risk.rr, 1) : "&mdash;";

    renderTradePlan(final, result.risk);

    // Merge fusion's per-engine validation report (status/weight) into the raw engine list for display.
    const weightByEngine = {};
    (result.fusion.engine_weight_report || []).forEach((w) => { weightByEngine[w.engine] = w; });
    const engines = result.engines.map((e) => ({
      ...e,
      validation_status: weightByEngine[e.engine] ? weightByEngine[e.engine].validation_status : "N/A",
    }));
    renderEngineTable(engines);

    document.getElementById("footer-source").textContent = result.data.primary_source || "&mdash;";
    document.getElementById("footer-volume-type").textContent = result.data.volume_type || "&mdash;";
    document.getElementById("footer-risk-pct").textContent = result.risk && result.risk.risk_percent ? `${result.risk.risk_percent}%` : "&mdash;";
    document.getElementById("footer-trades-today").textContent = result.risk ? `${result.risk.trades_taken_today ?? 0} / ${result.risk.max_daily_trades ?? 2}` : "&mdash;";
  } catch (err) {
    showError(err.message || "Unknown error running analysis.");
  } finally {
    setLoading(false);
  }
}

document.addEventListener("titan:analyze-clicked", runAnalysis);
document.addEventListener("titan:context-change", () => {
  els.content.style.display = "none";
  els.empty.style.display = "block";
  clearError();
});

// Auto-run once on load so the page isn't empty.
window.addEventListener("DOMContentLoaded", runAnalysis);
