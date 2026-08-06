const promptList = document.getElementById("promptList");
const responseOutput = document.getElementById("responseOutput");

let prompts = [];
let responses = {};

async function loadDemoData() {
  try {
    const [promptResponse, responseResponse] = await Promise.all([
      fetch("../assets/data/opex-prompts.json"),
      fetch("../assets/data/opex-responses.json")
    ]);

    if (!promptResponse.ok || !responseResponse.ok) {
      throw new Error("Could not load the OpEx demo files.");
    }

    const promptData = await promptResponse.json();
    const responseData = await responseResponse.json();

    prompts = promptData.prompts;
    responses = responseData.responses;

    renderPrompts();
  } catch (error) {
    console.error(error);

    promptList.innerHTML = `
      <p>
        The demo data could not be loaded.
      </p>
    `;
  }
}

function renderPrompts() {
  promptList.innerHTML = "";

  prompts.forEach((prompt) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "prompt-button";
    button.textContent = prompt.label;

    button.addEventListener("click", () => {
      displayResponse(prompt.responseId);
      setActivePrompt(button);
    });

    promptList.appendChild(button);
  });
}

function setActivePrompt(activeButton) {
  document
    .querySelectorAll(".prompt-button")
    .forEach((button) => {
      button.classList.remove("active");
    });

  activeButton.classList.add("active");
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
      <h3>${response.title}</h3>
  `;

  if (response.executiveSummary) {
    html += `
      <p class="executive-summary">
        ${response.executiveSummary}
      </p>
    `;
  }

  if (response.commentary) {
    html += `
      <div class="commentary-box">
        <h4>Draft commentary</h4>
        <p>${response.commentary}</p>
      </div>
    `;
  }

  if (response.metrics) {
    html += buildMetrics(response.metrics);
  }

  if (response.topEntities) {
    html += buildEntityTable(response.topEntities);
  }

  if (response.rankedDrivers) {
    html += buildDriverTable(response.rankedDrivers);
  }

  if (response.topGlCategories) {
    html += buildGlTable(response.topGlCategories);
  }

  if (response.largestMovements) {
    html += buildMovementTable(response.largestMovements);
  }

  if (response.methodology) {
    html += buildList(
      "How the agent reached this conclusion",
      response.methodology
    );
  }

  if (response.followUpQuestions) {
    html += buildList(
      "Suggested follow-up questions",
      response.followUpQuestions
    );
  }

  if (response.reviewFlags) {
    html += buildList(
      "Review flags",
      response.reviewFlags
    );
  }

  if (response.humanReview) {
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
        .map(([key, value]) => {
          return `
            <div class="metric-card">
              <span>${formatLabel(key)}</span>
              <strong>${formatValue(key, value)}</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function buildEntityTable(rows) {
  return `
    <div class="table-section">
      <h4>Top entities</h4>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Entity</th>
              <th>Actual MTD</th>
              <th>Forecast MTD</th>
              <th>Variance</th>
              <th>Result</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map((row) => {
                return `
                  <tr>
                    <td>${row.rank}</td>
                    <td>${row.entity}</td>
                    <td>${formatCurrency(row.actualMtd)}</td>
                    <td>${formatCurrency(row.forecastMtd)}</td>
                    <td>${formatCurrency(row.varianceVsFcst)}</td>
                    <td>${row.varianceLabel}</td>
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

function buildDriverTable(rows) {
  return `
    <div class="table-section">
      <h4>Top unfavorable variances</h4>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Entity</th>
              <th>Variance</th>
              <th>Share</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map((row) => {
                return `
                  <tr>
                    <td>${row.rank}</td>
                    <td>${row.entity}</td>
                    <td>${row.formattedVariance}</td>
                    <td>${row.shareOfUnfavorableVariancePct}%</td>
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

function buildGlTable(rows) {
  return `
    <div class="table-section">
      <h4>Largest GL categories</h4>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>GL category</th>
              <th>Actual MTD</th>
              <th>Forecast MTD</th>
              <th>Variance</th>
              <th>Result</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map((row) => {
                return `
                  <tr>
                    <td>${row.rank}</td>
                    <td>${row.glCategory}</td>
                    <td>${formatCurrency(row.actualMtd)}</td>
                    <td>${formatCurrency(row.forecastMtd)}</td>
                    <td>${formatCurrency(row.varianceVsFcst)}</td>
                    <td>${row.varianceLabel}</td>
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

function buildMovementTable(rows) {
  return `
    <div class="table-section">
      <h4>Largest month-over-month movements</h4>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>GL category</th>
              <th>Actual MTD</th>
              <th>Prior month</th>
              <th>Change</th>
              <th>Direction</th>
            </tr>
          </thead>

          <tbody>
            ${rows
              .map((row) => {
                return `
                  <tr>
                    <td>${row.rank}</td>
                    <td>${row.glCategory}</td>
                    <td>${formatCurrency(row.actualMtd)}</td>
                    <td>${formatCurrency(row.priorMonth)}</td>
                    <td>${formatCurrency(row.changeVsPrior)}</td>
                    <td>${row.changeLabel}</td>
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
      <h4>${title}</h4>

      <ol>
        ${items
          .map((item) => `<li>${item}</li>`)
          .join("")}
      </ol>
    </div>
  `;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatValue(key, value) {
  if (typeof value === "number") {
    if (
      key.toLowerCase().includes("actual") ||
      key.toLowerCase().includes("forecast") ||
      key.toLowerCase().includes("budget") ||
      key.toLowerCase().includes("variance") ||
      key.toLowerCase().includes("cost")
    ) {
      return formatCurrency(value);
    }

    return value.toLocaleString("en-US");
  }

  return value;
}

function formatLabel(value) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

loadDemoData();
