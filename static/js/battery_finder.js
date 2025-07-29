const makeSelect = document.getElementById("make");
const modelSelect = document.getElementById("model");
const yearSelect = document.getElementById("year");
const batteryInfo = document.getElementById("battery-info");
const resultBox = document.getElementById("result");

const recommendedBatteries = {
};

window.onload = async () => {
    addEventListeners();
    await fetchData();
};

function addEventListeners() {
    addMakeChangeListener();
    addModelChangeListener();
    addYearChangeListener();
}

function addMakeChangeListener() {
    makeSelect.addEventListener("change", async () => {
        const make = makeSelect.value;
        console.log("Make changed to:", make);
        await fetchCarModels(make);
        modelSelect.value = ""; // Reset model selection
        yearSelect.value = ""; // Reset year selection
        batteryInfo.textContent = ""; // Clear battery info
        resultBox.style.display = "none"; // Hide result box
    });
}

function addModelChangeListener() {
    modelSelect.addEventListener("change", () => {
        const make = makeSelect.value;
        const model = modelSelect.value;
        console.log("Model changed to:", model);
        if (make && model) {
            yearSelect.disabled = false; // Enable year selection
            fetchYears(make, model);
        } else {
            yearSelect.innerHTML = '';
            yearSelect.disabled = true; // Disable year selection
            batteryInfo.textContent = ""; // Clear battery info
            resultBox.style.display = "none"; // Hide result box
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
            fetchRecommendedBattery(make, model, year);
        } else {
            console.log("Incomplete selection, clearing battery info.");
            batteryInfo.textContent = ""; // Clear battery info
            resultBox.style.display = "none"; // Hide result box
        }
    });
}

async function fetchData(){
    const filePath = `${window.location.origin}/static/data/battery_finder.csv`;
    console.log(`CSV File: ${filePath}`);
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const csvText = await response.text();
        console.log('CSV contents:', csvText);

        const rows = csvText.trim().split('\n').map(row => row.split(','));
        console.log('Parsed rows:', rows);

        // You can now do something with `rows`, e.g. populate dropdowns
        // displayCSV(rows); <-- optional
    } catch (error) {
        console.error('Error loading CSV:', error);
    }
}

async function fetchCarMakes(){
    return fetch("http://41.139.158.69/api/battery-finder/car-makes")
        .then(res => res.json())
        .then(resultJson => {
            makeSelect.innerHTML = '';

            console.log("Car makes fetched:", resultJson);
            const makes = resultJson.data;

            let option = document.createElement("option");
            option.value = "";
            option.textContent = "Select Make";
            makeSelect.appendChild(option);

            if( makes.length === 0) {
                let option = document.createElement("option");
                option.value = "";
                option.textContent = "No makes available";
                makeSelect.appendChild(option);
                return;
            }

            makes.forEach(make => {
                let option = document.createElement("option");
                option.value = make;
                option.textContent = make;
                makeSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Failed to fetch car makes:", error);
            makeSelect.innerHTML = '<option value="">-- Failed to load makes --</option>';
            let option = document.createElement("option");
            option.value = "";
            option.textContent = "Error loading makes";
            makeSelect.appendChild(option);
        });
}


async function fetchCarModels(make) {
    console.log("Fetching car models for make:", make);
    if (!make) {
        modelSelect.innerHTML = '<option value="">Select Model</option>';
        return;
    }

    return fetch(`http://41.139.158.69/api/battery-finder/car-models?car_make=${make}`) 
        .then(res => res.json())
        .then(resultJson => {
            modelSelect.innerHTML = '';
            const models = resultJson.data;
            console.log("Models:", models);

            let option = document.createElement("option");
            option.value = "";
            option.textContent = "Select Model";
            modelSelect.appendChild(option);

            if (models.length === 0) {
                let option = document.createElement("option");
                option.value = "";
                option.textContent = "No models available";
                modelSelect.appendChild(option);
                return;
            }

            models.forEach(model => {
                let option = document.createElement("option");
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });

            modelSelect.disabled = false;
        })
        .catch(error => {
            console.error("Failed to fetch car models:", error);
            modelSelect.innerHTML = '<option value="">-- Failed to load models --</option>';
            let option = document.createElement("option");
            option.value = "";
            option.textContent = "Error loading models";
            modelSelect.appendChild(option);
        });
}

async function fetchYears(make, model) {
    console.log("Fetching years for make:", make, "and model:", model);
    if (!make || !model) {
        yearSelect.innerHTML = '<option value="">Select Year</option>';
        yearSelect.disabled = true; // Disable year selection
        return;
    }       

    return fetch(`http://41.139.158.69/api/battery-finder/years-of-manufacture?car_make=${make}&car_model=${model}`)
        .then(res => res.json())
        .then(resultJson => {
            yearSelect.innerHTML = '';
            console.log("Car years fetched:", resultJson);
            const years = resultJson.data;

            let option = document.createElement("option");
            option.value = "";
            option.textContent = "Select Year";
            yearSelect.appendChild(option);

            if( years.length === 0) {
                let option = document.createElement("option");
                option.value = "";
                option.textContent = "No years available";
                yearSelect.appendChild(option);
                return;
            }

            years.forEach(year => {
                let option = document.createElement("option");
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Failed to fetch car years:", error);
            let option = document.createElement("option");
            option.value = "";
            option.textContent = "Error loading years";
            yearSelect.appendChild(option);
        });
}


async function fetchRecommendedBattery(make, model, year) {
    console.log("Fetching recommended batteries for make:", make, "model:", model, "year:", year);
    if (!make || !model || !year) {
        batteryInfo.textContent = "Please select make, model, and year.";
        return;
    }
    return fetch(`http://41.139.158.69/api/battery-finder/recommended-battery?car_make=${make}&car_model=${model}&year_of_manufacture=${year}`)
        .then(res => res.json())
        .then(resultJson => {
            console.log("Recommended batteries fetched:", resultJson);
            const batteryList = resultJson.data;
            showResult(batteryList)
        })
        .catch(error => {
            console.error("Failed to fetch recommended batteries:", error);
            batteryInfo.textContent = "Error loading recommended batteries.";
        });
}


function showResult(batteryList) {
    if (!batteryList || batteryList.length === 0) {
        batteryInfo.textContent = "No recommended batteries found.";
        return;
    }

    batteryInfo.innerHTML = batteryList.map(battery => {
        return `<div class="battery-item">
            <h4>${battery}</h4>
        </div>`;
    }).join("");

    resultBox.style.display = "block";
}