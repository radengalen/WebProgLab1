const form = document.getElementById("point-form");
const xCheckboxes = document.querySelectorAll('input[name="x"]');
const yInput = document.getElementById("y-input");
const rRadios = document.querySelectorAll('input[name="r"]');
const errorMessage = document.getElementById("error-message");
const resultsBody = document.getElementById("results-body");
const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");

const STORAGE_KEY = "webLab1Results";
let results = loadResults();

// Only one X can be selected
xCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
            xCheckboxes.forEach(other => {
                if (other !== checkbox) other.checked = false;
            });
        }
    });
});

// Redraw graph when R changes
rRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        drawGraph(Number(radio.value));
    });
});

form.addEventListener("submit", event => {
    event.preventDefault();
    errorMessage.textContent = "";

    const selectedX = document.querySelector('input[name="x"]:checked');
    if (!selectedX) {
        showError("Please select an X value.");
        return;
    }
    const x = Number(selectedX.value);

    const yText = yInput.value.trim().replace(",", ".");
    const numberPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

    if (yText === "") {
        showError("Please enter a Y value.");
        return;
    }

    if (!numberPattern.test(yText)) {
        showError("Y must be a valid number.");
        return;
    }

    const y = Number(yText);

    if (!Number.isFinite(y)) {
        showError("Y must be a valid number.");
        return;
    }

    if (y <= -5 || y >= 5) {
        showError("Y must be strictly between -5 and 5.");
        return;
    }

    const selectedR = document.querySelector('input[name="r"]:checked');
    if (!selectedR) {
        showError("Please select an R value.");
        return;
    }

    const r = Number(selectedR.value);
    const hit = checkHit(x, y, r);

    results.push({
        x,
        y,
        r,
        hit,
        timestamp: Date.now()
    });

    saveResults();
    renderResults();
    drawGraph(r);
    drawPoint(x, y, r, hit);
});

function showError(message) {
    errorMessage.textContent = message;
}

function checkHit(x, y, r) {
    const rectangle =
        x >= -r && x <= 0 &&
        y >= 0 && y <= r / 2;

    const quarterCircle =
        x >= 0 && y >= 0 &&
        x * x + y * y <= (r / 2) ** 2;

    const triangle =
        x >= -r / 2 && x <= 0 &&
        y <= 0 && y >= -x - r / 2;

    return rectangle || quarterCircle || triangle;
}

// LocalStorage
function saveResults() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

function loadResults() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return [];

        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

// Results table
function renderResults() {
    resultsBody.innerHTML = "";

    results.slice().reverse().forEach(result => {
        const row = document.createElement("tr");

        const xCell = document.createElement("td");
        xCell.textContent = result.x;

        const yCell = document.createElement("td");
        yCell.textContent = result.y;

        const rCell = document.createElement("td");
        rCell.textContent = result.r;

        const hitCell = document.createElement("td");
        hitCell.textContent = result.hit ? "Попадание" : "Промах";
        hitCell.className = result.hit ? "hit" : "miss";

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(result.timestamp);

        row.append(xCell, yCell, rCell, hitCell, dateCell);
        resultsBody.appendChild(row);
    });
}

// Canvas
function drawGraph(r) {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.32 / r;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#3b95e8";

    // Rectangle
    ctx.fillRect(
        centerX - r * scale,
        centerY - (r / 2) * scale,
        r * scale,
        (r / 2) * scale
    );

    // Quarter circle
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(
        centerX,
        centerY,
        (r / 2) * scale,
        -Math.PI / 2,
        0
    );
    ctx.closePath();
    ctx.fill();

    // Triangle
    ctx.beginPath();
    ctx.moveTo(centerX - (r / 2) * scale, centerY);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(centerX, centerY + (r / 2) * scale);
    ctx.closePath();
    ctx.fill();

    // Axes
    ctx.strokeStyle = "#111";
    ctx.fillStyle = "#111";
    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(20, centerY);
    ctx.lineTo(width - 20, centerY);

    ctx.moveTo(width - 20, centerY);
    ctx.lineTo(width - 28, centerY - 5);

    ctx.moveTo(width - 20, centerY);
    ctx.lineTo(width - 28, centerY + 5);

    ctx.moveTo(centerX, height - 20);
    ctx.lineTo(centerX, 20);

    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX - 5, 28);

    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX + 5, 28);

    ctx.stroke();

    // X ticks
    drawTick(centerX - r * scale, centerY, "-R", true);
    drawTick(centerX - (r / 2) * scale, centerY, "-R/2", true);
    drawTick(centerX + (r / 2) * scale, centerY, "R/2", true);
    drawTick(centerX + r * scale, centerY, "R", true);

    // Y ticks
    drawTick(centerX, centerY - r * scale, "R", false);
    drawTick(centerX, centerY - (r / 2) * scale, "R/2", false);
    drawTick(centerX, centerY + (r / 2) * scale, "-R/2", false);
    drawTick(centerX, centerY + r * scale, "-R", false);

    ctx.font = "14px sans-serif";
    ctx.fillText("X", width - 18, centerY - 8);
    ctx.fillText("Y", centerX + 8, 18);
}

function drawTick(x, y, label, horizontal) {
    ctx.beginPath();

    if (horizontal) {
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x, y + 4);
        ctx.stroke();

        ctx.font = "12px sans-serif";
        ctx.fillText(label, x - 12, y - 8);
    } else {
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x + 4, y);
        ctx.stroke();

        ctx.font = "12px sans-serif";
        ctx.fillText(label, x + 8, y + 4);
    }
}

function drawPoint(x, y, r, hit) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = Math.min(canvas.width, canvas.height) * 0.32 / r;

    const pointX = centerX + x * scale;
    const pointY = centerY - y * scale;

    ctx.beginPath();
    ctx.arc(pointX, pointY, 5, 0, Math.PI * 2);

    ctx.fillStyle = hit ? "green" : "red";
    ctx.fill();

    ctx.strokeStyle = "#111";
    ctx.stroke();
}

renderResults();
drawGraph(1);