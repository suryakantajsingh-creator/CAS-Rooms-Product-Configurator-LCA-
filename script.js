// Update these if your CSV file names differ (files must be next to index.html)
const FILE_BOOK1 = "CAS Runiing meter and Element Book1.csv"; // columns: RM;Element
const FILE_BOOK3 = "Book3.csv";                               // columns: RM;Element;Height;Material
const FILE_INV   = "CAS Inventory .csv";                       // columns: RM;Element;Height;Material;Weight

const runningMeterSelect = document.getElementById("runningMeter");
const elementSelect = document.getElementById("element");
const heightSelect = document.getElementById("height");
const resultTable = document.getElementById("resultTable");

let book1 = [];
let book3 = [];
let inventory = [];

// ---------- CSV PARSER ----------
function parseCSV(text) {
  // strips BOM and splits by semicolon
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  return text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(row => row.split(";").map(cell => cell.trim()));
}

// ---------- LOAD ALL CSV ----------
Promise.all([
  fetch(FILE_BOOK1).then(r => {
    if (!r.ok) throw new Error(`Failed to load ${FILE_BOOK1}`);
    return r.text();
  }),
  fetch(FILE_BOOK3).then(r => {
    if (!r.ok) throw new Error(`Failed to load ${FILE_BOOK3}`);
    return r.text();
  }),
  fetch(FILE_INV).then(r => {
    if (!r.ok) throw new Error(`Failed to load ${FILE_INV}`);
    return r.text();
  })
]).then(([b1, b3, inv]) => {
  book1 = parseCSV(b1);           // keep as-is (no header drop)
  book3 = parseCSV(b3).slice(1);  // drop header
  inventory = parseCSV(inv).slice(1); // drop header
  populateRunningMeterAndElement();
}).catch(err => {
  console.error(err);
  resultTable.innerHTML = `<tr><td colspan="2">${err.message}</td></tr>`;
});

// ---------- STEP 1 ----------
function populateRunningMeterAndElement() {
  const runningMeters = new Set();
  const elements = new Set();

  book1.forEach(row => {
    if (row[0]) runningMeters.add(row[0]);
    if (row[1]) elements.add(row[1]);
  });

  runningMeterSelect.innerHTML = `<option value="">Select Running Meter</option>`;
  elements.size && (elementSelect.innerHTML = `<option value="">Select Element</option>`);

  runningMeters.forEach(rm => {
    runningMeterSelect.innerHTML += `<option value="${rm}">${rm}</option>`;
  });
  elements.forEach(el => {
    elementSelect.innerHTML += `<option value="${el}">${el}</option>`;
  });
}

// ---------- EVENT LISTENERS ----------
[runningMeterSelect, elementSelect, heightSelect].forEach(select =>
  select.addEventListener("change", updateResult)
);

// ---------- STEP 3 + 4 ----------
function updateResult() {
  const rm = runningMeterSelect.value;
  const el = elementSelect.value;
  const h = heightSelect.value;

  if (!rm || !el || !h) {
    resultTable.innerHTML = `<tr><td colspan="2">Select all options</td></tr>`;
    return;
  }

  // find materials from Book3
  const materials = book3
    .filter(r => r[0] === rm && r[1] === el && r[2] === h)
    .map(r => r[3]);

  if (materials.length === 0) {
    resultTable.innerHTML = `<tr><td colspan="2">No data found</td></tr>`;
    return;
  }

  resultTable.innerHTML = "";
  materials.forEach(mat => {
    const invRow = inventory.find(r => r[0] === rm && r[1] === el && r[2] === h && r[3] === mat);
    const weight = invRow ? invRow[4] : "N/A";
    resultTable.innerHTML += `
      <tr>
        <td>${mat}</td>
        <td>${weight}</td>
      </tr>
    `;
  });
}