TitanNav.render("data-health.html");

function row(label, value, status) {
  const dot = status === "ok" ? "var(--bullish)" : status === "warn" ? "var(--tertiary)" : "var(--bearish)";
  return `<tr><td>${label}</td><td class="numeric">${value}</td>
    <td style="text-align:right;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${dot};"></span></td></tr>`;
}

async function loadHealth() {
  const instrument = TitanNav.getInstrument();
  const timeframe = TitanNav.getTimeframe();
  document.getElementById("dh-instrument").textContent = `${instrument} / ${timeframe}`;

  const errorBox = document.getElementById("dh-error");
  errorBox.style.display = "none";

  try {
    const result = await Titan.getDataHealth(instrument, timeframe);

    if (result.status === "DATA_UNAVAILABLE") {
      errorBox.style.display = "flex";
      errorBox.textContent = `Data unavailable: ${result.error}`;
      document.getElementById("dh-verdict").textContent = "DATA UNAVAILABLE";
      document.getElementById("dh-verdict").className = "headline-lg bearish";
      document.getElementById("dh-table-body").innerHTML = "";
      return;
    }

    document.getElementById("dh-source").textContent = result.source;
    document.getElementById("dh-volume-type").textContent = result.volume_type;
    document.getElementById("dh-quality").textContent = result.data_quality;

    const v = result.validation || {};
    const verdictEl = document.getElementById("dh-verdict");
    if (v.valid) {
      verdictEl.textContent = "DATA VALID";
      verdictEl.className = "headline-lg bullish";
    } else {
      verdictEl.textContent = "DATA ISSUES";
      verdictEl.className = "headline-lg bearish";
    }

    const rows = [
      row("Duplicate Timestamps", v.duplicate_timestamps ?? "&mdash;", (v.duplicate_timestamps || 0) === 0 ? "ok" : "bad"),
      row("Volume Anomalies", v.volume_anomalies ?? "&mdash;", (v.volume_anomalies || 0) === 0 ? "ok" : "warn"),
      row("Data Gaps (&gt;1h)", v.data_gaps_over_1h ?? "&mdash;", (v.data_gaps_over_1h || 0) === 0 ? "ok" : "warn"),
      ...(v.errors && v.errors.length ? v.errors.map((e) => row("Error", e, "bad")) : []),
      ...(v.warnings && v.warnings.length ? v.warnings.map((w) => row("Warning", w, "warn")) : []),
    ];
    document.getElementById("dh-table-body").innerHTML = rows.join("");
  } catch (err) {
    errorBox.style.display = "flex";
    errorBox.textContent = err.message;
  }
}

document.addEventListener("titan:context-change", loadHealth);
document.addEventListener("titan:analyze-clicked", loadHealth);
window.addEventListener("DOMContentLoaded", loadHealth);
