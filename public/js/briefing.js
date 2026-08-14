TitanNav.render("briefing.html");

const INSTRUMENTS = ["XAUUSD", "EURUSD", "GBPUSD"];

function directionColorClass(direction) {
  if (direction === "BULLISH") return "bullish";
  if (direction === "BEARISH") return "bearish";
  return "neutral";
}

function renderBriefingCard(instrument, data) {
  if (data.status === "NO_BRIEFING_YET") {
    return `
      <div class="panel panel-body">
        <div class="label-caps" style="margin-bottom:8px;">${instrument}</div>
        <div style="color:var(--on-surface-variant); font-size:13px;">
          No briefing generated yet for this instrument. The scheduled job runs daily at 09:00 EAT —
          check back after that, or trigger it manually from GitHub Actions while testing.
        </div>
      </div>`;
  }

  const final = data.analysis.final;
  const dirClass = directionColorClass(final.direction);

  return `
    <div class="panel">
      <div class="panel-header">
        <span class="headline-md">${instrument}</span>
        <span class="data-mono ${dirClass}" style="font-size:16px;">${final.direction} — ${final.status}</span>
      </div>
      <div class="panel-body">
        <div style="display:flex; gap:32px; margin-bottom:16px; flex-wrap:wrap;">
          <div><div class="label-caps">Strength</div><div class="data-mono">${final.directional_strength}/100</div></div>
          <div><div class="label-caps">Confidence</div><div class="data-mono">${final.confidence_percent}%</div></div>
          <div><div class="label-caps">Tradeability</div><div class="data-mono">${final.tradeability_percent}%</div></div>
          <div><div class="label-caps">Timeframe</div><div class="data-mono">${data.timeframe}</div></div>
        </div>
        <pre style="white-space:pre-wrap; font-family:var(--font-body); font-size:13px; line-height:22px; color:var(--on-surface); margin:0;">${data.narrative}</pre>
      </div>
    </div>`;
}

async function loadBriefings() {
  const listEl = document.getElementById("briefing-list");
  const emptyEl = document.getElementById("briefing-empty");
  listEl.innerHTML = "";
  emptyEl.style.display = "none";

  document.getElementById("briefing-date-label").textContent = new Date().toDateString();

  try {
    const results = await Promise.all(INSTRUMENTS.map((i) => Titan.getBriefing(i)));
    const allMissing = results.every((r) => r.status === "NO_BRIEFING_YET");
    if (allMissing) {
      emptyEl.style.display = "block";
      emptyEl.textContent = "No briefings generated yet at all. The daily job runs at 09:00 EAT — nothing to do here until then.";
    }
    listEl.innerHTML = INSTRUMENTS.map((instrument, idx) => renderBriefingCard(instrument, results[idx])).join("");
  } catch (err) {
    emptyEl.style.display = "block";
    emptyEl.textContent = `Could not load briefings: ${err.message}`;
  }
}

document.addEventListener("titan:context-change", loadBriefings);
window.addEventListener("DOMContentLoaded", loadBriefings);
