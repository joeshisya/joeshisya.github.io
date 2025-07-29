let batteryFinderData = {};
const makeSelect = document.getElementById("make");
const modelSelect = document.getElementById("model");
const yearSelect = document.getElementById("year");
const batteryInfo = document.getElementById("battery-info");
const resultBox = document.getElementById("result");

const recommendedBatteries = {
};
const key = '1253';

window.onload = async () => {
    console.log(key)
    addEventListeners();
    let rows = await fetchData();
    batteryFinderData = processCSV(rows);
    showCarMakes();
};

window.addEventListener("message", (event) => {
    // if (event.origin === "https://www.chlorideexide.com/") {
        const receivedData = event.data;
        console.log("Received from Wix:", receivedData);
    // }
});

async function fetchData(){
    const filePath = `${window.location.origin}/static/data/battery_finder.csv`;
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const csvText = await response.text();

        const rows = csvText.trim().split('\n').map(row => row.split(','));

        return rows;
    } catch (error) {
        console.error('Error loading CSV:', error);

        return [];
    }
}

function processCSV(rows) {
    const data = {};

    for (let i = 1; i < rows.length; i++) { // skip header row
        const [_, car_make, car_model, yom, rec_batt] = rows[i];

        if (!data[car_make]) {
            data[car_make] = {};
        }

        if (!data[car_make][car_model]) {
            data[car_make][car_model] = {};
        }

        if (!data[car_make][car_model][yom]) {
            data[car_make][car_model][yom] = [];
        }

        if (!data[car_make][car_model][yom].includes(rec_batt)) {
            data[car_make][car_model][yom].push(rec_batt);
        }
    }

    return data;
}

async function showCarMakes(){
    const makes = Object.keys(batteryFinderData).sort();
    console.log(`${key}: makes => ${JSON.stringify(makes)}`);
    makeSelect.innerHTML = ''; // Clear existing options

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = 'Select Make';
    makeSelect.appendChild(defaultOption);

    makes.forEach(make => {
        const option = document.createElement('option');
        option.value = make;
        option.text = make;
        makeSelect.appendChild(option);
    });
    
    modelSelect.innerHTML = '<option value="">Select Model</option>';
    yearSelect.innerHTML = '<option value="">Select Year</option>';
    modelSelect.disabled = true;
    yearSelect.disabled = true;
}


async function showCarModels(make) {
    if (!make || !batteryFinderData[make]) return;

    const models = Object.keys(batteryFinderData[make]).sort();
    modelSelect.innerHTML = `<option value="">Select Model</option>` +
        models.map(model => `<option value="${model}">${model}</option>`).join("");

    modelSelect.disabled = false;
    yearSelect.innerHTML = '<option value="">Select Year</option>';
    yearSelect.disabled = true;
}

async function showYears(make, model) {
    if (!make || !model || !batteryFinderData[make][model]) return;

    const years = Object.keys(batteryFinderData[make][model]).sort();
    yearSelect.innerHTML = `<option value="">Select Year</option>` +
        years.map(year => `<option value="${year}">${year}</option>`).join("");

    yearSelect.disabled = false;
}

function populateSelect(selectElement, optionsArray, defaultText = 'Select') {
    selectElement.innerHTML = ''; // Clear previous options

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = defaultText;
    selectElement.appendChild(defaultOption);

    optionsArray.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.text = optionValue;
        selectElement.appendChild(option);
    });

    selectElement.disabled = optionsArray.length === 0;
}


function showRecommendedBattery(make, model, year) {
    const batteryList = batteryFinderData?.[make]?.[model]?.[year] || [];
    showResult(batteryList);
}


function showResult(batteryList) {
    if (!batteryList || batteryList.length === 0) {
        alert("No recommended batteries found.");
        return;
    }

    // For now, just use the first recommended battery
    const battery = batteryList[0];

    document.getElementById("popup-title").textContent = battery;
    document.getElementById("popup-price").textContent = "";
    document.getElementById("popup-sku").textContent = "";
    // document.getElementById("popup-qty").value = 1;

    document.getElementById("product-popup").classList.remove("hidden");
}

function increaseQty() {
  let input = document.getElementById("popup-qty");
  input.value = parseInt(input.value) + 1;
}

function decreaseQty() {
  let input = document.getElementById("popup-qty");
  if (parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1;
  }
}

function closeProductPopup() {
  document.getElementById("product-popup").classList.add("hidden");
}


function addEventListeners() {
    addMakeChangeListener();
    addModelChangeListener();
    addYearChangeListener();
}

function addMakeChangeListener() {
    makeSelect.addEventListener("change", async () => {
        const make = makeSelect.value;
        console.log("Make changed to:", make);
        await showCarModels(make);
        modelSelect.value = "";
        yearSelect.value = "";
    });
}

function addModelChangeListener() {
    modelSelect.addEventListener("change", () => {
        const make = makeSelect.value;
        const model = modelSelect.value;
        console.log("Model changed to:", model);
        if (make && model) {
            yearSelect.disabled = false; // Enable year selection
            showYears(make, model);
        } else {
            yearSelect.innerHTML = '';
            yearSelect.disabled = true;
            batteryInfo.textContent = "";
        }
    });
}

function addYearChangeListener() {
    yearSelect.addEventListener("change", () => {
        const make = makeSelect.value;
        const model = modelSelect.value;
        const year = yearSelect.value;
        console.log("Year changed to:", year);
        if (make && model && year) {
            console.log("Fetching recommended battery for:", make, model, year);
            showRecommendedBattery(make, model, year);
        } else {
            console.log("Incomplete selection, clearing battery info.");
            batteryInfo.textContent = "";
        }
    });
}
