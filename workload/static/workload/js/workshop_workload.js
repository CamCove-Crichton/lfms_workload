let opportunityData;
// let previousOpportunityData;  // Variable to store the previous opportunity data

// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    rollingCalendar(91);
    fetchData(91).then(data => {
        opportunityData = data;
        displayOpportunities(opportunityData);
    });
    setInterval( () => {
        rollingCalendar(91);
        fetchData(91).then(data => {
            opportunityData = data;
        });
    }, 2 * 60 * 60 * 1000);
});

/**
 * Function to fetch the data from the API from the backend
 * @returns {Promise} - The data from the API
 * @param {number} days - The number of days to fetch the data for
 */
function fetchData(days) {
    let overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'flex';
    void overlay.offsetWidth;
    overlay.classList.add('show');
    return fetch(`/workload/api/workshop_workload/?days=${days}`)
        .then(response => response.json())
        .then (data => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.style.display = 'none', 500);
            return data;
        })
        .catch(error => {
            console.error('Error:', error);
            const errorMsgDiv = document.querySelector('#api-error-msg');
            const errorMsg = document.createElement('p');
            errorMsg.textContent = 'An error occurred while fetching the workload data: ' + error;
            errorMsgDiv.appendChild(errorMsg);
        });
}

/**
 * Function to display the opportunities in the calendar
 * @param {object} data - The data from the API
 */
function displayOpportunities(data) {
    // let scenicDiv = document.getElementById('scenic-opps');
    let activeProducts = data.active_products;
    let opportunities = data.opportunities_with_items;

    // Assign the scenic opportunities
    let scenicOpportunities = getScenicTagOpportunities(opportunities);
    
    // Create opportunity elements
    for (let j = 0; j < scenicOpportunities.length; j++) {
        let opportunityEvent = scenicOpportunities[j];
        let status = opportunityEvent.opportunity['status'];
        let statusName = opportunityEvent.opportunity['status_name'];
        let opportunityName = opportunityEvent.opportunity['subject'];
        let id = opportunityEvent.opportunity['id'];
        let client = opportunityEvent.opportunity['member']['name'];
        let opportunityItems = opportunityEvent.items;

        // Check if the opportunity items are in the active products list
        let itemNameArray = confirmItemsExistInActiveProducts(opportunityItems, activeProducts);

        // Calculate the total quantity of half hours for each item and convert to hours
        let scenicCalcArray = calculateScenicCalcItemQuantity(itemNameArray);

        // Get the total number of hours from the scenic calc array
        let totalHours = calculateTotalHours(scenicCalcArray);

        // Create a div to display the Scenic Calc items
        let scenicCalcDiv = createScenicCalcDiv(scenicCalcArray);

        // Set the start date and time
        let dateAndTime = setOpportunityDateAndTime(opportunityEvent);
        let startDate = dateAndTime.startDate;
        let startTime = dateAndTime.startTime;
        console.log(startDate);

        // Set the opportunity type
        let opportunityType = setOpportunityType(opportunityEvent);

        // Get the cell to display the opportunity
        let cells = document.getElementsByClassName('cell-border');
        for (let q = 0; q < cells.length; q++) {
            // Check the start date of the opportunity
            if (cells[q].id == startDate) {
                if (status !== 20) {
                    let opportunityDiv = document.createElement('div');
                    opportunityDiv.classList.add('opportunity');
                    if (status === 1) {
                        opportunityDiv.classList.add('provisional_background');
                    } else if (status === 5) {
                        opportunityDiv.classList.add('reserved_background');
                    } else {
                        opportunityDiv.classList.add('text-bg-success');
                    }
                    opportunityDiv.style.width = '100%';
                    opportunityDiv.classList.add('mb-3', 'rounded-corners');
                    opportunityDiv.setAttribute('data-hire-type', opportunityType);
                    opportunityDiv.innerHTML = `
                        <span class="badge rounded-pill truncate">${opportunityName}</span>
                        <button type="button" class="btn btn-primary mb-1">
                          ${totalHours} <span class="badge text-bg-secondary">#</span>
                        </button>`;
                    cells[q].appendChild(opportunityDiv);
                }
            }
        }
    }
}

/**
 * A function to create a list of opportunities with a 'SCENIC' tag
 * @param {object} opportunities - The opportunities data
 * @returns {array} - The scenic opportunities
 */
function getScenicTagOpportunities(opportunities) {
    let scenicOpportunities = [];

    // Iterate through the opportunities
    for (let i = 0; i < opportunities.length; i++) {
        //Create an array to store scenic opportunities
        let opportunity = opportunities[i].opportunity;
        let items = opportunities[i].items;

        //Check if the opportunity has a scenic tag
        if (opportunity.tag_list && opportunity.tag_list.includes('SCENIC')) {
            //Add the opportunity to the scenic opportunities array
            scenicOpportunities.push({
                'opportunity': opportunity,
                'items': items
            });
        }   
    }

    return scenicOpportunities;
}

/**
 * Function to check if the opportunity items are in the active products list
 * @param {array} opportunityItems - The opportunity items
 * @param {array} activeProducts - The active products list
 * @returns {array} - The items that exist in the active products list
 */
function confirmItemsExistInActiveProducts(opportunityItems, activeProducts) {
    let itemNameArray = [];

    // Iterate through opportunity items and check if they are in the active products list
    for (let k = 0; k < opportunityItems.length; k++) {
        let itemName = opportunityItems[k].name;
        let itemQuantity = opportunityItems[k].quantity;
        for (let l = 0; l < activeProducts.length; l++) {
            let activeProductName = activeProducts[l].name;
            if (itemName === activeProductName) {
                itemNameArray.push({
                    'name': itemName,
                    'quantity': itemQuantity
                });
            }
        }
    }

    return itemNameArray;
}

/**
 * Function to calculate the total quantity of half hours for each item and convert to hours
 * @param {array} itemNameArray - The item name array containing an object with the item name and quantity
 * @returns {array} - The scenic calc array containing the item name and quantity in hours
 */
function calculateScenicCalcItemQuantity(itemNameArray) {
    let scenicCalcArray = [];

    // Iterate through the item name array and calculate the total quantity of each item
    for (let m = 0; m < itemNameArray.length; m++) {
        let itemName = itemNameArray[m].name.split("-")[0].trim();
        let itemQuantity = itemNameArray[m].quantity;
        let itemExists = false;
        for (let n = 0; n < scenicCalcArray.length; n++) {
            if (itemName === scenicCalcArray[n].name) {
                scenicCalcArray[n].quantity = parseFloat(scenicCalcArray[n].quantity) + (parseFloat(itemQuantity) / 2);
                itemExists = true;
            }
        }
        if (!itemExists) {
            scenicCalcArray.push({
                'name': itemName,
                'quantity': parseFloat(itemQuantity) / 2
            });
        }
    }

    return scenicCalcArray;
}

/**
 * Function to calculate the total hours from the scenic calc array
 * @param {array} calcArray - The scenic calc array containing the item name and quantity in hours
 * @returns {number} - The total number of hours
 */
function calculateTotalHours(calcArray) {
    // Get the total number of hours from the scenic calc array
    let totalHours = 0;
    for (let p = 0; p < calcArray.length; p++) {
        totalHours += calcArray[p].quantity;
    }

    return totalHours;
}

/**
 * Function to create a div to display the Scenic Calc items
 * @param {array} calcArray - The scenic calc array containing the item name and quantity in hours
 * @returns {object} - The scenic calc div
 */
function createScenicCalcDiv(calcArray) {
    // Create a div to display the Scenic Calc items
    let scenicCalcDiv = document.createElement('div');
    scenicCalcDiv.classList.add('card-text');
    for (let o = 0; o < calcArray.length; o++) {
        let scenicCalcName = calcArray[o].name;
        let scenicCalcQuantity = calcArray[o].quantity;
        let scenicCalcP = document.createElement('p');
        scenicCalcP.innerHTML = `<span class="bold-text">${scenicCalcName}:</span> ${scenicCalcQuantity} hours`;
        scenicCalcDiv.appendChild(scenicCalcP);
    }

    return scenicCalcDiv;
}

/**
 * Function to set the date and time of the opportunity
 * @param {object} opportunityEvent - The opportunity event object
 * @returns {object} - The start date and time of the opportunity
 */
function setOpportunityDateAndTime(opportunityEvent) {
    let startDate;
    let startTime;
    let loadStartsAt;

    // Set the start date and time
    if (opportunityEvent.opportunity['load_starts_at'] !== null) {
        startDate = opportunityEvent.opportunity['load_starts_at'].split('T')[0];
        loadStartsAt = new Date(opportunityEvent.opportunity['load_starts_at']);
        startTime = loadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } else if (opportunityEvent.opportunity['deliver_starts_at'] !== null) {
        startDate = opportunityEvent.opportunity['deliver_starts_at'].split('T')[0];
        loadStartsAt = new Date(opportunityEvent.opportunity['deliver_starts_at']);
        startTime = loadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } else {
        startDate = opportunityEvent.opportunity['starts_at'].split('T')[0];
        loadStartsAt = new Date(opportunityEvent.opportunity['starts_at']);
        startTime = loadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    return { startDate, startTime };
}

/**
 * Function to set the opportunity type
 */
function setOpportunityType(opportunityEvent) {
    let opportunityType;

    // Set the opportunity type
    if (opportunityEvent.opportunity['custom_fields']['dry_hire'] === 'Yes') {
        opportunityType = 'Dry Hire';
    } else if (opportunityEvent.opportunity['custom_fields']['dry_hire_transport'] === 'Yes') {
        opportunityType = 'Dry Hire Transport';
    } else {
        opportunityType = 'Wet Hire';
    }

    return opportunityType;
}

/**
 * Function to create a rolling calendar
 * @param {number} days - The number of days to display on the calendar
 */
function rollingCalendar(days) {
    let today = new Date();
    let rollingDates = Array.from({length: days}, (_, i) => {
        let date = new Date(today.getTime());
        date.setDate(today.getDate() + i);
        return date;
    });

    let cells = document.getElementsByClassName('cell-border');
    for (let i = 0; i < cells.length; i++) {
        if (rollingDates[i]) {
            cells[i].id = rollingDates[i].toISOString().split('T')[0];
    
            let day = rollingDates[i].getDate();
            let month = rollingDates[i].toLocaleString('default', { month: 'short' });
            let weekday = rollingDates[i].toLocaleString('default', { weekday: 'short' });
            cells[i].innerHTML = `<p class="mb-1">${weekday} ${day} ${month}</p>`;
        }
    }
}