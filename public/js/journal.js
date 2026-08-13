TitanNav.render("journal.html");

function resultClass(result) {
  if (result === "WIN") return "bullish";
  if (result === "LOSS") return "bearish";
  return "neutral";
}

async function loadJournal() {
  const instrument = TitanNav.getInstrument();
  document.getElementById("tj-instrument").textContent = instrument;
  const body = document.getElementById("journal-table-body");
  const empty = document.getElementById("journal-empty");

  try {
    const result = await Titan.getJournal(instrument);
    const entries = result.entries || [];
    if (entries.length === 0) {
      body.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";
    body.innerHTML = entries
      .map(
        (e) => `
        <tr>
          <td class="numeric">${e.id}</td>
          <td>${e.timeframe || "&mdash;"}</td>
          <td>${e.direction || "&mdash;"}</td>
          <td class="numeric">${e.entry ?? "&mdash;"}</td>
          <td class="numeric">${e.stop ?? "&mdash;"}</td>
          <td class="numeric">${e.target ?? "&mdash;"}</td>
          <td class="${resultClass(e.result)}">${e.result || "OPEN"}</td>
          <td class="numeric">${e.r_multiple ?? "&mdash;"}</td>
        </tr>`
      )
      .join("");
  } catch (err) {
    body.innerHTML = "";
    empty.style.display = "block";
    empty.textContent = `Could not load journal: ${err.message}`;
  }
}

async function logTrade() {
  const instrument = TitanNav.getInstrument();
  const timeframe = TitanNav.getTimeframe();
  const errorBox = document.getElementById("journal-error");
  errorBox.style.display = "none";

  const entry = {
    instrument,
    timeframe,
    direction: document.getElementById("j-direction").value,
    entry: parseFloat(document.getElementById("j-entry").value) || null,
    stop: parseFloat(document.getElementById("j-stop").value) || null,
    target: parseFloat(document.getElementById("j-target").value) || null,
    result: document.getElementById("j-result").value || null,
    r_multiple: parseFloat(document.getElementById("j-r").value) || null,
    opened_at: new Date().toISOString(),
  };

  try {
    await Titan.postJournal(entry);
    await loadJournal();
    ["j-entry", "j-stop", "j-target", "j-r"].forEach((id) => (document.getElementById(id).value = ""));
  } catch (err) {
    errorBox.style.display = "block";
    errorBox.textContent = err.message;
  }
}

document.getElementById("log-trade-btn").addEventListener("click", logTrade);
document.getElementById("refresh-journal-btn").addEventListener("click", loadJournal);
document.addEventListener("titan:context-change", loadJournal);

window.addEventListener("DOMContentLoaded", loadJournal);
