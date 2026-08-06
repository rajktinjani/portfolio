const promptList = document.getElementById("promptList");
const responseOutput = document.getElementById("responseOutput");

let prompts = [];
let responses = {};

async function loadDemoData() {
  try {
    const [promptResponse, responseResponse] = await Promise.all([
      fetch("../assets/data/wfp-prompts.json"),
      fetch("../assets/data/wfp-responses.json")
    ]);

    if (!promptResponse.ok || !responseResponse.ok) {
      throw new Error("Could not load the workforce planning demo files.");
    }

    const promptData = await promptResponse.json();
    const responseData = await responseResponse.json();

    prompts = promptData.prompts;
    responses = responseData.responses;

    renderPrompts();
  } catch (error) {
    console.error(error);

    promptList.innerHTML = `
      <p class="error-message">
        The workforce planning demo data could not be loaded.
      </p>
    `;

    responseOutput.innerHTML = `
      <p>
        Please confirm that the WFP JSON files are stored inside
        <strong>assets/data</strong>.
      </p>
    `;
  }
}

function renderPrompts() {
  promptList.innerHTML = "";

  prompts.forEach((prompt, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "prompt-button";
    button.textContent = prompt.label;
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => {
      displayResponse(prompt.responseId);
      setActivePrompt(button);
    });

    promptList.appendChild(button);

    if (index === 0) {
      button.click();
    }
  });
}

function setActivePrompt(activeButton) {
  document.querySelectorAll(".prompt-button").forEach((button) => {
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
  });

  activeButton.classList.add("active");
  activeButton.setAttribute("aria-pressed", "true");
}

function displayResponse(responseId) {
  const response = responses[responseId];

  if (!response) {
    responseOutput.innerHTML = `
      <p>No response was found for this prompt.</p>
    `;

    return;
  }

  responseOutput.innerHTML = buildResponseHtml(response);
}

function buildResponseHtml(response) {
  let html = `
    <article class="agent-response">
      <h3>${escapeHtml(response.title || "Workforce analysis")}</h3>
  `;

  if (response.executiveSummary) {
    html += `
      <p class="executive-summary">
        ${escapeHtml(response.executiveSummary)}
      </p>
    `;
  }

  if (response.commentary) {
    html += `
      <div class="commentary-box">
        <h4>Draft commentary</h4>
        <p>${escapeHtml(response.commentary)}</p>
      </div>
    `;
  }

  if (response.movementMetrics) {
    html += buildMetrics(response.movementMetrics);
  }

  if (response.metrics) {
    html += buildMetrics(response.metrics);
  }

  if (response.supportingMetrics) {
    html += buildMetrics(response.supportingMetrics);
  }

  if (response.entityMovements) {
    html += buildEntityMovementTable(response.entityMovements);
  }

  if (response.newHires) {
    html += buildNewHireTable(response.newHires);
  }

  if (response.leavers) {
    html += buildLeaverTable(response.leavers);
  }

  if (response.transfers) {
    html += buildTransferTable(response.transfers);
  }

  if (response.delayedHires) {
    html += buildDelayedHireTable(response.delayedHires);
  }

  if (response.largestEntities) {
    html += buildEntityCostTable(response.largestEntities);
  }

  if (response.costImpact) {
    html += buildMetrics(response.costImpact);
  }

  if (response.reviewNotes) {
    html += buildList("Review notes", response.reviewNotes);
  }

  if (response.riskFlags) {
    html += buildList("Personnel-cost risk flags", response.riskFlags);
  }

  if (response.humanReview?.checks) {
    html += buildList(
      "Human review required",
      response.humanReview.checks
    );
  }

  html += `</article>`;

  return html;
}

function buildMetrics(metrics) {
  return `
    <div class="metric-grid">
      ${Object.entries(metrics)
        .filter(([, value]) => {
          return (
            typeof value === "string" ||
            typeof value === "number"
          );
        })
        .map(([key, value]) => {
          return `
            <div class="metric-card">
              <span>${escapeHtml(formatLabel(key))}</span>
              <strong>${escapeHtml(formatValue(key, value))}</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function buildEntityMovementTable(rows) {
  return `
    <div class="table-section">
      <h4>Movement by entity</h4>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Entity</th>
              <th>New hires</th>
              <th>Leavers</th>
              <th>Transfers</th>
              <th>Promotions</th>
              <th>Net HC change</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map((row) => {
                return `
                  <tr>
                    <td>${escapeHtml(row.entity)}</td>
                    <td>${formatNumber(row.newHires)}</td>
                    <td>${formatNumber(row.leavers)}</td>
                    <td>${formatNumber(row.transfers)}</td>
                    <td>${formatNumber(row.promotions)}</td>
                    <td>${formatSignedNumber(row.netHeadcountChange)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function buildNewHireTable(rows) {
  return `
    <div class="table-section">
      <h4>New hires</h4>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee</th>
              <th>Entity</th>
              <th>Department</th>
              <th>Title</th>
              <th>Forecast start</th>
              <th>Actual start</th>
              <th>Monthly cost</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map((row) => {
                return `
                  <tr>
                    <td>${escapeHtml(row.employeeId)}</td>
                    <td>${escapeHtml(row.employeeName)}</td>
                    <td>${escapeHtml(row.entity)}</td>
                    <td>${escapeHtml(row.department)}</td>
                    <td>${escapeHtml(row.title)}</td>
                    <td>${formatDate(row.forecastStartDate)}</td>
                    <td>${formatDate(row.actualStartDate)}</td>
                    <td>${formatCurrency(row.monthlyCost)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function buildLeaverTable(rows) {
  return `
    <div class="table-section">
      <h4>Leavers</h4>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee</th>
              <th>Entity</th>
              <th>Department</th>
              <th>Title</th>
              <th>Monthly cost</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map((row) => {
                return `
                  <tr>
                    <td>${escapeHtml(row.employeeId)}</td>
                    <td>${escapeHtml(row.employeeName)}</td>
                    <td>${escapeHtml(row.entity)}</td>
                    <td>${escapeHtml(row.department)}</td>
                    <td>${escapeHtml(row.title)}</td>
                    <td>${formatCurrency(row.monthlyCost)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function buildTransferTable(rows) {
  return `
    <div class="table-section">
      <h4>Cost-center transfers</h4>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee</th>
              <th>Entity</th>
              <th>Department</th>
              <th>Previous cost center</th>
              <th>Current cost center</th>
              <th>Monthly cost</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map((row) => {
                return `
                  <tr>
                    <td>${escapeHtml(row.employeeId)}</td>
                    <td>${escapeHtml(row.employeeName)}</td>
                    <td>${escapeHtml(row.entity)}</td>
                    <td>${escapeHtml(row.department)}</td>
                    <td>${escapeHtml(row.previousCostCenter)}</td>
                    <td>${escapeHtml(row.currentCostCenter)}</td>
                    <td>${formatCurrency(row.monthlyCost)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function buildDelayedHireTable(rows) {
  return `
    <div class="table-section">
      <h4>Delayed hires versus forecast</h4>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee</th>
              <th>Entity</th>
              <th>Department</th>
              <th>Forecast start</th>
              <th>Actual start</th>
              <th>Delay</th>
              <th>Monthly cost</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map((row) => {
                return `
                  <tr>
                    <td>${escapeHtml(row.employeeId)}</td>
                    <td>${escapeHtml(row.employeeName)}</td>
                    <td>${escapeHtml(row.entity)}</td>
                    <td>${escapeHtml(row.department)}</td>
                    <td>${formatDate(row.forecastStartDate)}</td>
                    <td>${formatDate(row.actualStartDate)}</td>
                    <td>${formatNumber(row.delayDays)} days</td>
                    <td>${formatCurrency(row.monthlyCost)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function buildEntityCostTable(rows) {
  return `
    <div class="table-section">
      <h4>Largest entities by monthly personnel cost</h4>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Entity</th>
              <th>Monthly cost</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map((row) => {
                return `
                  <tr>
                    <td>${escapeHtml(row.entity)}</td>
                    <td>${formatCurrency(row.monthlyCost)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function buildList(title, items) {
  return `
    <div class="insight-list">
      <h4>${escapeHtml(title)}</h4>

      <ol>
        ${items
          .map((item) => {
            return `<li>${escapeHtml(item)}</li>`;
          })
          .join("")}
      </ol>
    </div>
  `;
}

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value ?? "");
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(numericValue);
}

function formatNumber(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value ?? "");
  }

  return numericValue.toLocaleString("en-US");
}

function formatSignedNumber(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value ?? "");
  }

  return new Intl.NumberFormat("en-US", {
    signDisplay: "always",
    maximumFractionDigits: 0
  }).format(numericValue);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatValue(key, value) {
  if (typeof value === "number") {
    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey.includes("cost") ||
      normalizedKey.includes("salary") ||
      normalizedKey.includes("expense")
    ) {
      return formatCurrency(value);
    }

    return formatNumber(value);
  }

  return String(value ?? "");
}

function formatLabel(value) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadDemoData();
