TitanNav.render("validation.html");

function badgeClass(status) {
  return (status || "").toLowerCase();
}

async function loadStatuses() {
  const instrument = TitanNav.getInstrument();
  document.getElementById("vl-instrument").textContent = instrument;
  const body = document.getElementById("status-table-body");
  const empty = document.getElementById("status-empty");

  try {
    const result = await Titan.getValidation(instrument);
    const engines = result.engines || [];
    if (engines.length === 0) {
      body.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    body.innerHTML = engines
      .map(
        (e) => `
        <tr>
          <td>${e.engine}</td>
          <td><span class="badge ${badgeClass(e.status)}">${e.status}</span></td>
          <td class="numeric">${e.sample_size ?? 0}</td>
          <td class="numeric">${e.win_rate_percent !== null && e.win_rate_percent !== undefined ? e.win_rate_percent + "%" : "&mdash;"}</td>
          <td class="numeric">${e.expectancy_r ?? "&mdash;"}</td>
          <td class="numeric">${e.profit_factor ?? "&mdash;"}</td>
          <td style="font-size:12px; color:var(--on-surface-variant);">${e.reason || ""}</td>
        </tr>`
      )
      .join("");
  } catch (err) {
    body.innerHTML = "";
    empty.style.display = "block";
    empty.textContent = `Could not load validation status: ${err.message}`;
  }
}

async function runBacktest() {
  const instrument = TitanNav.getInstrument();
  const engine = document.getElementById("engine-select").value;
  const timeframe = document.getElementById("bt-timeframe-select").value;
  const bars = parseInt(document.getElementById("bars-input").value, 10);
  const minimum_sample = parseInt(document.getElementById("min-sample-input").value, 10);

  const btn = document.getElementById("run-backtest-btn");
  const resultBox = document.getElementById("backtest-result");
  const errorBox = document.getElementById("backtest-error");

  btn.disabled = true;
  btn.textContent = "Running (this can take a while on 5000 bars)…";
  errorBox.style.display = "none";
  resultBox.style.display = "none";

  try {
    const result = await Titan.runBacktest(instrument, { engine, timeframe, bars, minimum_sample });
    resultBox.style.display = "block";
    const oos = result.out_of_sample.statistics;
    resultBox.innerHTML = `
      <div class="label-caps" style="margin-bottom:8px;">Result: ${engine} on ${instrument} / ${timeframe}</div>
      <div style="display:flex; gap:32px; flex-wrap:wrap;">
        <div><div class="label-caps">Promoted Status</div><div class="badge ${badgeClass(result.promoted_status)}" style="margin-top:4px;">${result.promoted_status}</div></div>
        <div><div class="label-caps">Total Trades (all history)</div><div class="data-mono">${result.total_trades_all_history}</div></div>
        <div><div class="label-caps">Out-of-Sample Trades</div><div class="data-mono">${oos.sample_size ?? 0}</div></div>
        <div><div class="label-caps">Win Rate</div><div class="data-mono">${oos.win_rate_percent ?? "&mdash;"}%</div></div>
        <div><div class="label-caps">Expectancy (R)</div><div class="data-mono">${oos.expectancy_r ?? "&mdash;"}</div></div>
        <div><div class="label-caps">Profit Factor</div><div class="data-mono">${oos.profit_factor ?? "&mdash;"}</div></div>
      </div>`;
    await loadStatuses();
  } catch (err) {
    errorBox.style.display = "block";
    errorBox.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Run Backtest";
  }
}

async function runAllBacktests() {
  const instrument = TitanNav.getInstrument();
  const btn = document.getElementById("run-all-backtest-btn");
  const resultBox = document.getElementById("run-all-result");
  const errorBox = document.getElementById("backtest-error");

  btn.disabled = true;
  btn.textContent = "Fetching H1 data once and testing all 4 engines (this can take a minute)…";
  errorBox.style.display = "none";
  resultBox.style.display = "none";

  try {
    const result = await Titan.runBacktestAll(instrument, { timeframe: "H1", bars: 5000, minimum_sample: 100 });
    resultBox.style.display = "block";
    const rows = Object.entries(result.results).map(([engine, r]) => {
      const oos = r.out_of_sample.statistics;
      return `
        <tr>
          <td>${engine}</td>
          <td><span class="badge ${badgeClass(r.promoted_status)}">${r.promoted_status}</span></td>
          <td class="numeric">${r.total_trades_all_history}</td>
          <td class="numeric">${oos.sample_size ?? 0}</td>
          <td class="numeric">${oos.win_rate_percent ?? "&mdash;"}${oos.win_rate_percent != null ? "%" : ""}</td>
          <td class="numeric">${oos.expectancy_r ?? "&mdash;"}</td>
        </tr>`;
    }).join("");
    resultBox.innerHTML = `
      <div class="label-caps" style="margin-bottom:8px;">${instrument} / H1 &mdash; ${result.bars_fetched} bars fetched once, 4 engines tested</div>
      <table class="tech-table">
        <thead><tr><th>Engine</th><th>Status</th><th>Total Trades</th><th>OOS Sample</th><th>Win Rate</th><th>Expectancy (R)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    await loadStatuses();
  } catch (err) {
    errorBox.style.display = "block";
    errorBox.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Run All 4 Engines (1 fetch)";
  }
}

document.getElementById("run-backtest-btn").addEventListener("click", runBacktest);
document.getElementById("run-all-backtest-btn").addEventListener("click", runAllBacktests);
document.getElementById("refresh-status-btn").addEventListener("click", loadStatuses);
document.addEventListener("titan:context-change", loadStatuses);
document.addEventListener("titan:analyze-clicked", loadStatuses);

window.addEventListener("DOMContentLoaded", loadStatuses);
