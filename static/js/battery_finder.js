let batteryFinderData = {};
let wixProductsList = [];
const makeSelect = document.getElementById("make");
const modelSelect = document.getElementById("model");
const yearSelect = document.getElementById("year");
const batteryInfo = document.getElementById("battery-info");
const resultBox = document.getElementById("result");

const recommendedBatteries = {
};
const key = 'key-1293';

window.onload = async () => {
    addEventListeners();
    let rows = await fetchData();
    batteryFinderData = processCSV(rows);
    showCarMakes();
    debug();
};

window.addEventListener("message", (event) => {
    // if (event.origin === "https://www.chlorideexide.com/") {
        const receivedData = event.data;
        const products = receivedData.products;
        if(products){
            wixProductsList = products;
            console.log(`Products: ${products.length}`);
        }
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

    const battery = batteryList[0];
    let product = null;
    
    for(const wixProduct of wixProductsList){
        console.log(`Searching if ${battery} in ${wixProduct.name}`);
        try{
           if(wixProduct.name.toLowerCase().includes(battery.toLowerCase())) {
                product = wixProduct;
                break;
            }
        }
        catch(e){
            console.log(e);
            break;
        }
    }

    // TODO: Remove in live version
    // product = wixProductsList.length > 0 ? wixProductsList[0] : null;

    if(product !== null){
        document.getElementById("popup-title").textContent = product.name;
        document.getElementById("popup-price").textContent = product.formattedPrice;
        document.getElementById("popup-sku").textContent = product.sku;
        document.getElementById("popup-details-link").addEventListener("click", () => {
            window.open(`https://www.chlorideexide.com${product.productPageUrl}`);
        });

        const wixUrl = product.mainMedia;
        const imageId = wixUrl.match(/wix:image:\/\/v1\/([^\/]+)/)[1];
        const imageUrl = `https://static.wixstatic.com/media/${imageId}`;
        document.getElementById("popup-image").src = imageUrl;
        document.getElementById("product-popup").classList.remove("hidden");
    }
    else {
        let resultDiv = document.getElementById("result");
        resultDiv.classList.remove("hidden");
        resultDiv.innerText = battery;
        let goToShop = document.getElementById("go-to-shop");
        goToShop.classList.remove("hidden");
    }

    // document.getElementById("popup-qty").value = 1;

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
        await showCarModels(make);
        modelSelect.value = "";
        yearSelect.value = "";
    });
}

function addModelChangeListener() {
    modelSelect.addEventListener("change", () => {
        const make = makeSelect.value;
        const model = modelSelect.value;
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
        if (make && model && year) {
            showRecommendedBattery(make, model, year);
        } else {
            console.error("Incomplete selection, clearing battery info.");
            batteryInfo.textContent = "";
        }
    });
}


function debug(){
    setInterval(function(){
            console.log(`Key: ${key}`);
    }, 5000);
}

function goToShop(){
    const shopLink = document.getElementById("shop-link");
    shopLink.href = "https://www.chlorideexide.com/category/all-products?Automotive=Automotive%2520Batteries";
    window.open(shopLink.href);
}

function openPage(link){
    window.open(link);
}