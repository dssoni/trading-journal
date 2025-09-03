// File: frontend/view-trades.js

let allTradesCache = [];
let currentClosingTradeId = null;
let currentClosingTradeNotes = "";

document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:8080/api/trades")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch trades");
      return response.json();
    })
    .then((trades) => {
      allTradesCache = trades;
      const tableBody = document.getElementById("tradesTableBody");
      tableBody.innerHTML = "";

      trades.forEach((trade) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${trade.symbol}</td>
          <td>${trade.assetType}</td>
          <td>${trade.entryDate}</td>
          <td>${trade.exitDate || "-"}</td>
          <td>${trade.tradeStatus}</td>
          <td>${trade.pnl !== null ? `$${trade.pnl}` : "-"}</td>
          <td></td>
        `;

        // Create action button container as flex row
        const actionCell = row.querySelector("td:last-child");
        const actionWrapper = document.createElement("div");
        actionWrapper.className = "action-buttons";

        // View Button
        const viewBtn = document.createElement("button");
        viewBtn.textContent = "View";
        viewBtn.className = "button";
        viewBtn.addEventListener("click", () => {
          alert(`View trade ${trade.id} — Feature coming soon!`);
        });
        actionWrapper.appendChild(viewBtn);

        // Close Button (only if OPEN)
        if (trade.tradeStatus === "OPEN") {
          const closeBtn = document.createElement("button");
          closeBtn.textContent = "Close";
          closeBtn.className = "button";
          closeBtn.addEventListener("click", () => openCloseTradeModal(trade));
          actionWrapper.appendChild(closeBtn);
        }

        actionCell.appendChild(actionWrapper);
        tableBody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error loading trades:", error);
      const tableBody = document.getElementById("tradesTableBody");
      tableBody.innerHTML = "<tr><td colspan='7'>Error loading trades.</td></tr>";
    });

  // Modal event listeners
  document.getElementById("cancelCloseBtn").onclick = function() {
    document.getElementById("closeTradeModal").style.display = "none";
    currentClosingTradeId = null;
  };

  document.getElementById("closeTradeForm").onsubmit = function(e) {
    e.preventDefault();
    const exitPrice = parseFloat(document.getElementById("exitPrice").value);
    const exitDate = document.getElementById("exitDate").value;
    const exitTime = document.getElementById("exitTime").value;
    const notes = document.getElementById("exitNotes").value;

    // Compose datetime string
    const exitDateTime = exitDate + "T" + (exitTime || "00:00");

    fetch(`http://localhost:8080/api/trades/${currentClosingTradeId}/close`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        exitPrice,
        exitDate: exitDateTime,
        notes
      })
    })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to close trade.");
      alert("Trade closed successfully!");
      document.getElementById("closeTradeModal").style.display = "none";
      location.reload();
    })
    .catch((err) => {
      alert("Failed to close trade.");
      document.getElementById("closeTradeModal").style.display = "none";
    });
  };
});

// --- MODAL LOGIC ---
function openCloseTradeModal(trade) {
  currentClosingTradeId = trade.id;
  currentClosingTradeNotes = trade.notes || "";

  // Fill modal fields
  document.getElementById("exitPrice").value = "";
  // Default: today
  const today = new Date();
  document.getElementById("exitDate").value = today.toISOString().slice(0,10);
  document.getElementById("exitTime").value = today.toTimeString().slice(0,5);
  document.getElementById("exitNotes").value = currentClosingTradeNotes;
  document.getElementById("closeTradeModal").style.display = "flex";
  setTimeout(() => document.getElementById("exitPrice").focus(), 200);
}
