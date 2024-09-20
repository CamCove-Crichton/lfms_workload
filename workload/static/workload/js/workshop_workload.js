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

        // Get the number of working days from the total hours of the opportunity
        let workingDays = calculateWorkingDays(totalHours);

        // Set the start date and time
        let dateAndTime = setOpportunityDateAndTime(opportunityEvent);
        let startDate = dateAndTime.startDate;
        let startTime = dateAndTime.startTime;

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
                    opportunityDiv.innerHTML = `<span class="badge rounded-pill truncate">${opportunityName}</span>`;
                    
                    // Create a button to open the modal
                    let button = document.createElement('button');
                    button.type = 'button';
                    button.classList.add('btn', 'btn-primary', 'mb-1', 'openModalButton');
                    button.setAttribute('data-bs-toggle', 'modal');
                    button.setAttribute('data-bs-target', '#scenicCalcModal');
                    button.textContent = `Total: ${totalHours} hours / ${workingDays} days `;
                    let badge = document.createElement('span');
                    badge.classList.add('badge', 'text-bg-secondary');
                    badge.textContent = '#';
                    button.appendChild(badge);

                    // Append the button to the opportunityDiv
                    opportunityDiv.appendChild(button);

                    cells[q].appendChild(opportunityDiv);

                    // Call the function to update the modal title and body
                    updateModalContent(button, scenicCalcArray, id, client, startDate, startTime, statusName, totalHours, workingDays);
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
 * Function to calculate the number of working days from the total hours of the opportunity
 * and round up to the nearest half day
 * @param {number} totalHours - The total number of hours
 * @returns {number} - The number of working days
 */
function calculateWorkingDays(totalHours) {
    let workingHalfDays = Math.ceil(totalHours / 4);
    let workingDays = workingHalfDays / 2;

    return workingDays;
}

/**
 * Function to create a div to display the Scenic Calc items and other opportunity details
 * @param {array} calcArray - The scenic calc array containing the item name and quantity in hours
 * @returns {object} - The scenic calc div
 */
function createScenicCalcDiv(calcArray, client, startDate, startTime, status, totalHours, workingDays) {
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

    // Add the total hours and working days to the Scenic Calc div
    let totalHoursP = document.createElement('p');
    totalHoursP.innerHTML = `<span class="bold-text">Total:</span> ${totalHours} hours / ${workingDays} days`;

    // Add other elements to the modal body
    let clientP = additionalContent('Client', client);
    let dateOutP = additionalContent('Date Out', startDate, startTime);
    let statusP = additionalContent('Status', status);

    // Get the modal body element
    let modalBody = document.querySelector('#scenicCalcModal .modal-body');

    // Clear the modal body before appending the scenicCalcDiv
    modalBody.innerHTML = '';

    // Append the elements to the modal body
    modalBody.appendChild(clientP);
    modalBody.appendChild(dateOutP);
    modalBody.appendChild(statusP);
    modalBody.appendChild(scenicCalcDiv);
    modalBody.appendChild(totalHoursP);
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

/**
 * Function to get all the buttons with the class 'openModalButton'
 * and add an event listener to each button to update the modal
 */
function updateModalContent(button, calcArray, id, client, startDate, startTime, status, totalHours, workingDays) {
    button.addEventListener('click', function() {
        // Get the opportunity name
        let opportunityName = this.parentElement.querySelector('.badge').textContent;

        // Get the modal title element
        let modalTitle = document.querySelector('#scenicCalcModal .modal-title');

        // Set the modal title
        modalTitle.textContent = opportunityName;
        modalTitle.classList.add('bold-text');

        // Create the scenicCalcDiv and append it to the modal body
        createScenicCalcDiv(calcArray, client, startDate, startTime, status, totalHours, workingDays);
        openOpportunity(id);
    });
}

/**
 * Function to create buttons to open the opportunity in a new tab or close the modal
 * @param {number} id - The opportunity ID
 */
function openOpportunity(id) {
    let anchor = document.createElement('a');
    anchor.href = `https://lfps.current-rms.com/opportunities/${id}`;
    anchor.target = '_blank';
    anchor.className = 'btn btn-primary';
    anchor.textContent = 'Open in Current RMS';

    let closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn btn-secondary';
    closeButton.setAttribute('data-bs-dismiss', 'modal');
    closeButton.textContent = 'Close';

    // Get modal footer element
    let modalFooter = document.querySelector('#scenicCalcModal .modal-footer');

    // Clear the modal footer before appending the anchor
    modalFooter.innerHTML = '';

    // Append the anchor to the modal footer
    modalFooter.appendChild(anchor);
    modalFooter.appendChild(closeButton);

}

/**
 * Function to add additional content to the modal
 */
function additionalContent(string, content, contentTwo=null) {
    let contentP = document.createElement('p');
    if (contentTwo) {
        contentP.innerHTML = `<span class="bold-text">${string}:</span> ${content}, ${contentTwo}`
    } else{
        contentP.innerHTML = `<span class="bold-text">${string}:</span> ${content}`
    }

    return contentP;
}