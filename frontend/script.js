// frontend/script.js

// === Dynamic Symbol Suggestions: MAG7 + SPY, auto-add, auto-remove (15 days) ===

const defaultTickers = ["AAPL", "MSFT", "GOOG", "AMZN", "NVDA", "META", "TSLA", "SPY"];
const expiryDays = 15;

function nowISO() { return new Date().toISOString(); }
function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
function getTickerUsage() {
  return JSON.parse(localStorage.getItem("tickerUsage") || "{}");
}
function setTickerUsage(usage) {
  localStorage.setItem("tickerUsage", JSON.stringify(usage));
}
// Update or add ticker with current timestamp
function touchTicker(ticker) {
  ticker = ticker.toUpperCase();
  let usage = getTickerUsage();
  usage[ticker] = nowISO();
  setTickerUsage(usage);
}
// Prune unused tickers
function pruneTickers() {
  const usage = getTickerUsage();
  const cutoff = daysAgoISO(expiryDays);
  let changed = false;
  for (const [ticker, lastUsed] of Object.entries(usage)) {
    if (lastUsed < cutoff) {
      delete usage[ticker];
      changed = true;
    }
  }
  if (changed) setTickerUsage(usage);
}
// Get current active suggestions
function getActiveTickers() {
  pruneTickers();
  const usage = getTickerUsage();
  const cutoff = daysAgoISO(expiryDays);
  let all = [...defaultTickers, ...Object.keys(usage)];
  all = [...new Set(all.map(t => t.toUpperCase()))];
  return all.filter(ticker => {
    if (usage[ticker]) {
      return usage[ticker] >= cutoff;
    }
    return true;
  });
}
// Render datalist
function renderTickerSuggestions() {
  const datalist = document.getElementById("tickers");
  if (!datalist) return;
  const suggestions = getActiveTickers();
  datalist.innerHTML = "";
  suggestions.forEach(ticker => {
    const option = document.createElement("option");
    option.value = ticker;
    datalist.appendChild(option);
  });
}

// === Init ===
document.addEventListener("DOMContentLoaded", renderTickerSuggestions);

// On field blur, update suggestions (helps if user edits manually)
document.getElementById("symbol").addEventListener("blur", renderTickerSuggestions);

// === Handle Trade Form Submission ===

document.getElementById("tradeForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;

  const data = {
    symbol: form.symbol.value.toUpperCase(),
    assetType: form.assetType.value,
    optionType: form.optionType.value || null,
    entryPrice: parseFloat(form.entryPrice.value),
    entryDate: form.entryDate.value || null,
    positionSize: parseInt(form.positionSize.value),
    broker: form.broker.value,
    commission: form.commission.value ? parseFloat(form.commission.value) : null,
    notes: form.notes.value || ""
  };

  try {
    // Update symbol usage & datalist immediately on submit
    touchTicker(data.symbol);
    renderTickerSuggestions();

    const response = await fetch("http://localhost:8080/api/trades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Something went wrong");
    }

    alert("Trade submitted successfully!");
    form.reset();
  } catch (error) {
    console.error("Error submitting trade:", error);
    alert("Failed to submit trade.\n" + error.message);
  }
});
