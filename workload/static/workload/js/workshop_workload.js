let opportunityData;
let previousOpportunityData = null;  // Variable to store the previous opportunity data

// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    rollingCalendar(91);
    // Retrieve the previous opportunity data from local storage
    previousOpportunityData = JSON.parse(localStorage.getItem('previousOpportunityData'));
    fetchData(91).then(data => {
        opportunityData = data;
        compareOpportunityData(opportunityData, previousOpportunityData);
        displayOpportunities(opportunityData, previousOpportunityData);
        clickDisplayNone();
        previousOpportunityData = opportunityData;
        // Store the previous opportunity data in local storage
        localStorage.setItem('previousOpportunityData', JSON.stringify(previousOpportunityData));
    });
    setInterval( () => {
        rollingCalendar(91);
        fetchData(91).then(data => {
            opportunityData = data;
            // Retrieve the previous opportunity data from local storage
            previousOpportunityData = JSON.parse(localStorage.getItem('previousOpportunityData'));
            compareOpportunityData(opportunityData, previousOpportunityData);
            displayOpportunities(opportunityData, previousOpportunityData);
            clickDisplayNone();
            previousOpportunityData = opportunityData;
            // Update the previous opportunity data in local storage
            localStorage.setItem('previousOpportunityData', JSON.stringify(previousOpportunityData));
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
 * @param {object} currentData - The current opportunity data
 * @param {object} previousData - The previous opportunity data
 */
function displayOpportunities(currentData, previousData=null) {
    // Check for invalid input
    if (!currentData || typeof currentData !== 'object') {
        console.error('Invalid input to displayOpportunities: currentData must be an object');
        return;
    }
    
    try {
        // Get the current & previous opportunity element objects
        let currentOpportunityElements = getOpportunityElementObjects(currentData);
        
        // Create opportunity elements
        for (let i = 0; i < currentOpportunityElements.length; i++) {
            let matchFound = false;
            let currentOpportunity = currentOpportunityElements[i];
            let currentOpportunityId = currentOpportunity.id;
            let currentOpportunityName = currentOpportunity.opportunityName;
            let currentStatusName = currentOpportunity.statusName;
            let currentTotalHours = currentOpportunity.totalHours;
            let workingDays = currentOpportunity.workingDays;
            let startDate = currentOpportunity.startDate;
            let status = currentOpportunity.status;
            let opportunityType = currentOpportunity.opportunityType;
            let cells = document.getElementsByClassName('cell-border');

            if (previousData) {
                // Get the cell to display the opportunity
                console.log('Previous data exists');
                let previousOpportunityElements = getOpportunityElementObjects(previousData);
                for (let j = 0; j < previousOpportunityElements.length; j++) {
                    let previousOpportunity = previousOpportunityElements[j];
                    let previousOpportunityId = previousOpportunity.id;
                    let previousOpportunityName = previousOpportunity.opportunityName;
                    let previousStatusName = previousOpportunity.statusName;
                    let previousTotalHours = previousOpportunity.totalHours;
                    let totalHoursDifference = currentTotalHours - previousTotalHours;
                    if (currentOpportunityId === previousOpportunityId) {
                        matchFound = true;
                        for (let q = 0; q < cells.length; q++) {
                            // Check the start date of the opportunity
                            if (cells[q].id == startDate) {
                                if (status !== 20) {
                                    let opportunityDiv = document.createElement('div');
                                    opportunityDiv.classList.add('opportunity', 'position-relative');
                                    if (status === 1) {
                                        opportunityDiv.classList.add('provisional_background');
                                    } else if (status === 5) {
                                        opportunityDiv.classList.add('reserved_background');
                                    } else {
                                        opportunityDiv.classList.add('open-background');
                                    }
                                    opportunityDiv.style.width = '100%';
                                    opportunityDiv.classList.add('mb-3', 'rounded-corners');
                                    opportunityDiv.setAttribute('data-hire-type', opportunityType);
                                    if (currentOpportunityName !== previousOpportunityName || currentStatusName !== previousStatusName) {
                                        opportunityDiv.innerHTML = `<span class="badge rounded-pill truncate">${currentOpportunityName}</span>
                                        <span class="position-absolute top-0 start-100 translate-middle p-2 bg-info border border-light rounded-circle click-display-none">
                                            <span class="visually-hidden">New alerts</span>
                                        </span>`;
                                    } else {
                                        opportunityDiv.innerHTML = `<span class="badge rounded-pill truncate">${currentOpportunityName}</span>`;
                                    }
                                    
                                    // Create a button to open the modal
                                    let button = document.createElement('button');
                                    button.type = 'button';
                                    button.classList.add('btn', 'btn-primary', 'mb-1', 'openModalButton');
                                    button.setAttribute('data-bs-toggle', 'modal');
                                    button.setAttribute('data-bs-target', '#scenicCalcModal');
                                    button.textContent = `Total: ${currentTotalHours} hours / ${workingDays} days`;
                                    let badge = document.createElement('span');
                                    badge.classList.add('badge', 'click-display-none');
                                    if (currentTotalHours > previousTotalHours) {
                                        badge.classList.add('bg-danger');
                                        badge.textContent = `${totalHoursDifference}`;
                                    } else if(currentTotalHours < previousTotalHours) {
                                        badge.classList.add('bg-success');
                                        badge.textContent = `${totalHoursDifference}`;
                                    } else {
                                        badge.style.display = 'none';
                                    }
                                    button.appendChild(badge);
                
                                    // Append the button to the opportunityDiv
                                    opportunityDiv.appendChild(button);
                
                                    cells[q].appendChild(opportunityDiv);
                
                                    // Call the function to update the modal title and body
                                    updateModalContent(button, currentOpportunity, previousOpportunity);
                                }
                            }
                        }
                        break;
                    }

                }

                if (!matchFound) {
                    for (let q = 0; q < cells.length; q++) {
                        // Check the start date of the opportunity
                        if (cells[q].id == startDate) {
                            if (status !== 20) {
                                let opportunityDiv = document.createElement('div');
                                opportunityDiv.classList.add('opportunity', 'position-relative');
                                if (status === 1) {
                                    opportunityDiv.classList.add('provisional_background');
                                } else if (status === 5) {
                                    opportunityDiv.classList.add('reserved_background');
                                } else {
                                    opportunityDiv.classList.add('open-background');
                                }
                                opportunityDiv.style.width = '100%';
                                opportunityDiv.classList.add('mb-3', 'rounded-corners');
                                opportunityDiv.setAttribute('data-hire-type', opportunityType);
                                opportunityDiv.innerHTML = `<span class="badge rounded-pill truncate">${currentOpportunityName}</span>
                                <span class="position-absolute top-0 start-100 translate-middle p-2 bg-warning border border-light rounded-circle click-display-none">
                                    <span class="visually-hidden">New alerts</span>
                                </span>`;
                                
                                
                                // Create a button to open the modal
                                let button = document.createElement('button');
                                button.type = 'button';
                                button.classList.add('btn', 'btn-primary', 'mb-1', 'openModalButton');
                                button.setAttribute('data-bs-toggle', 'modal');
                                button.setAttribute('data-bs-target', '#scenicCalcModal');
                                button.textContent = `Total: ${currentTotalHours} hours / ${workingDays} days`;
                                let badge = document.createElement('span');
                                badge.classList.add('badge', 'bg-warning', 'click-display-none');
                                badge.textContent = `${currentTotalHours}`;
                                
                                button.appendChild(badge);
            
                                // Append the button to the opportunityDiv
                                opportunityDiv.appendChild(button);
            
                                cells[q].appendChild(opportunityDiv);
            
                                // Call the function to update the modal title and body
                                updateModalContent(button, currentOpportunity);
                            }
                        }
                    }
                }
            } else {
                for (let q = 0; q < cells.length; q++) {
                    // Check the start date of the opportunity
                    if (cells[q].id == startDate) {
                        if (status !== 20) {
                            let opportunityDiv = document.createElement('div');
                            opportunityDiv.classList.add('opportunity', 'position-relative');
                            if (status === 1) {
                                opportunityDiv.classList.add('provisional_background');
                            } else if (status === 5) {
                                opportunityDiv.classList.add('reserved_background');
                            } else {
                                opportunityDiv.classList.add('open-background');
                            }
                            opportunityDiv.style.width = '100%';
                            opportunityDiv.classList.add('mb-3', 'rounded-corners');
                            opportunityDiv.setAttribute('data-hire-type', opportunityType);
                            opportunityDiv.innerHTML = `<span class="badge rounded-pill truncate">${currentOpportunityName}</span>
                            <span class="position-absolute top-0 start-100 translate-middle p-2 bg-info border border-light rounded-circle click-display-none">
                                <span class="visually-hidden">New alerts</span>
                            </span>`;
                            
                            
                            // Create a button to open the modal
                            let button = document.createElement('button');
                            button.type = 'button';
                            button.classList.add('btn', 'btn-primary', 'mb-1', 'openModalButton');
                            button.setAttribute('data-bs-toggle', 'modal');
                            button.setAttribute('data-bs-target', '#scenicCalcModal');
                            button.textContent = `Total: ${currentTotalHours} hours / ${workingDays} days`;
                            let badge = document.createElement('span');
                            badge.classList.add('badge', 'text-bg-secondary');
                            badge.textContent = 'New alerts';
                            badge.style.display = 'none';
                            
                            button.appendChild(badge);
        
                            // Append the button to the opportunityDiv
                            opportunityDiv.appendChild(button);
        
                            cells[q].appendChild(opportunityDiv);
        
                            // Call the function to update the modal title and body
                            updateModalContent(button, currentOpportunity);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the displayOpportunities function when attempting to display the workload data: ' + error;
        errorMsgDiv.appendChild(errorMsg);
    }
}

/**
 * A function to create a list of opportunities with a 'SCENIC' tag
 * @param {object} opportunities - The opportunities data
 * @returns {array} - The scenic opportunities
 */
function getScenicTagOpportunities(opportunities) {
    try {
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
    } catch (error) {
        console.error('Error in getScenicTagOpportunities:', error);
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the getScenicTagOpportunities function when attempting to get the scenic tag opportunities: ' + error;
        errorMsgDiv.appendChild(errorMsg);
        return [];
    }
}

/**
 * Function to check if the opportunity items are in the active products list
 * @param {array} opportunityItems - The opportunity items
 * @param {array} activeProducts - The active products list
 * @returns {array} - The items that exist in the active products list
 */
function confirmItemsExistInActiveProducts(opportunityItems, activeProducts) {
    // Check if opportunityItems and activeProducts are arrays
    if (!Array.isArray(opportunityItems) || !Array.isArray(activeProducts)) {
        console.error('Invalid input to confirmItemsExistInActiveProducts: opportunityItems and activeProducts must be arrays');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the confirmItemsExistInActiveProducts function: opportunityItems and activeProducts must be arrays';
        errorMsgDiv.appendChild(errorMsg);
        return [];
    }

    try {
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
    } catch (error) {
        console.error('Error in confirmItemsExistInActiveProducts:', error);
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the confirmItemsExistInActiveProducts function when attempting to confirm the items exist in the active products list: ' + error;
        errorMsgDiv.appendChild(errorMsg);
        return [];
    }
}

/**
 * Function to calculate the total quantity of half hours for each item and convert to hours
 * @param {array} itemNameArray - The item name array containing an object with the item name and quantity
 * @returns {array} - The scenic calc array containing the item name and quantity in hours
 */
function calculateScenicCalcItemQuantity(itemNameArray) {
    // Check if itemNameArray is an array
    if (!Array.isArray(itemNameArray)) {
        console.error('Invalid input to calculateScenicCalcItemQuantity: itemNameArray must be an array');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the calculateScenicCalcItemQuantity function: itemNameArray must be an array';
        errorMsgDiv.appendChild(errorMsg);
        return [];
    }

    try {
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

    } catch (error) {
        console.error('Error in calculateScenicCalcItemQuantity:', error);
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the calculateScenicCalcItemQuantity function when attempting to calculate the total quantity of each item: ' + error;
        errorMsgDiv.appendChild(errorMsg);
        return [];
    }
}

/**
 * Function to calculate the total hours from the scenic calc array
 * @param {array} calcArray - The scenic calc array containing the item name and quantity in hours
 * @returns {number} - The total number of hours
 */
function calculateTotalHours(calcArray) {
    // Check if calcArray is an array
    if (!Array.isArray(calcArray)) {
        console.error('Invalid input to calculateTotalHours: calcArray must be an array');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the calculateTotalHours function: calcArray must be an array';
        errorMsgDiv.appendChild(errorMsg);
        return 0;
    }

    try {
        // Get the total number of hours from the scenic calc array
        let totalHours = 0;
        for (let p = 0; p < calcArray.length; p++) {
            totalHours += calcArray[p].quantity;
        }
        return totalHours;

    } catch (error) {
        console.error('Error in calculateTotalHours:', error);
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the calculateTotalHours function when attempting to calculate the total number of hours: ' + error;
        errorMsgDiv.appendChild(errorMsg);
        return 0;
    }
}

/**
 * Function to calculate the number of working days from the total hours of the opportunity
 * and round up to the nearest half day
 * @param {number} totalHours - The total number of hours
 * @returns {number} - The number of working days
 */
function calculateWorkingDays(totalHours) {
    // Check the total hours is a number
    if (isNaN(totalHours)) {
        console.error('Invalid input to calculateWorkingDays: totalHours must be a number');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the calculateWorkingDays function: totalHours must be a number';
        errorMsgDiv.appendChild(errorMsg);
        return 0;
    }

    let workingHalfDays = Math.ceil(totalHours / 4);
    let workingDays = workingHalfDays / 2;

    return workingDays;
}

/**
 * Function to create a div to display the Scenic Calc items and other opportunity details
 * @param {array} calcArray - The scenic calc array containing the item name and quantity in hours
 * @returns {object} - The scenic calc div
 */
function createScenicCalcDiv(opportunityElement) {
    // Check that the opportunity element is an object
    if (typeof opportunityElement !== 'object') {
        console.error('Invalid input to createScenicCalcDiv: opportunityElement must be an object');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the createScenicCalcDiv function: opportunityElement must be an object';
        errorMsgDiv.appendChild(errorMsg);
        return {};
    }

    // Check that the opportunity element has the required properties
    if (!opportunityElement.scenicCalcArray || !Array.isArray(opportunityElement.scenicCalcArray) || !opportunityElement.client || !opportunityElement.startDate || !opportunityElement.startTime || !opportunityElement.statusName || typeof opportunityElement.totalHours !== 'number' || typeof opportunityElement.workingDays !== 'number') {
        console.error('Invalid input to createScenicCalcDiv: opportunityElement must have the required properties');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the createScenicCalcDiv function: opportunityElement must have the required properties';
        errorMsgDiv.appendChild(errorMsg);
        return {};
    }
        

    try {
        let calcArray = opportunityElement.scenicCalcArray;
        let client = opportunityElement.client;
        let startDate = opportunityElement.startDate;
        let startTime = opportunityElement.startTime;
        let status = opportunityElement.statusName;
        let totalHours = opportunityElement.totalHours;
        let workingDays = opportunityElement.workingDays;

        // Create a div to display the Scenic Calc items
        let scenicCalcDiv = document.createElement('div');
        scenicCalcDiv.classList.add('card-text');
        for (let o = 0; o < calcArray.length; o++) {
            let scenicCalcName = calcArray[o].name;
            let scenicCalcQuantity = calcArray[o].quantity;
            let scenicCalcP = document.createElement('p');
            scenicCalcP.classList.add('position-relative');
            scenicCalcP.innerHTML = `<span class="bold-text">${scenicCalcName}:</span> ${scenicCalcQuantity} hours`;
            scenicCalcDiv.appendChild(scenicCalcP);
        }

        // Add the total hours and working days to the Scenic Calc div
        let totalHoursP = document.createElement('p');
        totalHoursP.classList.add('position-relative');
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

        // Call function to set the display to none when the user hovers over the element
        clickDisplayNone();
    } catch (error) {
        console.error('Error in createScenicCalcDiv:', error);
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the createScenicCalcDiv function when attempting to create the Scenic Calc div: ' + error;
        errorMsgDiv.appendChild(errorMsg);
        return {};
    }
}

/**
 * Function to set the date and time of the opportunity
 * @param {object} opportunityEvent - The opportunity event object
 * @returns {object} - The start date and time of the opportunity
 */
function setOpportunityDateAndTime(opportunityEvent) {
    // Check that the opportunity event is an object
    if (typeof opportunityEvent !== 'object' || !opportunityEvent.opportunity || typeof opportunityEvent.opportunity !== 'object') {
        console.error('Invalid input to setOpportunityDateAndTime: opportunityEvent must be an object and opportunityEvent.opportunity must exist and be an object');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the setOpportunityDateAndTime function: opportunityEvent must be an object and opportunityEvent.opportunity must exist and be an object';
        errorMsgDiv.appendChild(errorMsg);
        return { startDate: '', startTime: '' };
    }

    try {
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
    } catch (error) {
        console.error('Error in setOpportunityDateAndTime:', error);
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the setOpportunityDateAndTime function when attempting to set the start date and time of the opportunity: ' + error;
        errorMsgDiv.appendChild(errorMsg);
        return { startDate: '', startTime: '' };
    }
}

/**
 * Function to set the opportunity type
 */
function setOpportunityType(opportunityEvent) {
    // Check that the opportunity event is an object
    if (typeof opportunityEvent !== 'object' || !opportunityEvent.opportunity || typeof opportunityEvent.opportunity !== 'object' || !opportunityEvent.opportunity.custom_fields || typeof opportunityEvent.opportunity.custom_fields !== 'object') {
        console.error('Invalid input to setOpportunityType: opportunityEvent must be an object, opportunityEvent.opportunity and opportunityEvent.opportunity.custom_fields must exist and be objects');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the setOpportunityType function: opportunityEvent must be an object, opportunityEvent.opportunity and opportunityEvent.opportunity.custom_fields must exist and be objects';
        errorMsgDiv.appendChild(errorMsg);
        return '';
    }

    try {
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
        } catch (error) {
            console.error('Error in setOpportunityType:', error);
            const errorMsgDiv = document.querySelector('#api-error-msg');
            const errorMsg = document.createElement('p');
            errorMsg.textContent = 'An error occurred while running the setOpportunityType function when attempting to set the opportunity type: ' + error;
            errorMsgDiv.appendChild(errorMsg);
            return '';
        }
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
function updateModalContent(button, opportunityElementOne, opportunityElementTwo=null) {
    let id = opportunityElementOne.id;
    button.addEventListener('click', function() {
        // Get the opportunity name
        let opportunityName = this.parentElement.querySelector('.badge').textContent;

        // Get the modal title element
        let modalTitle = document.querySelector('#scenicCalcModal .modal-title');

        // Set the modal title
        modalTitle.textContent = opportunityName;
        modalTitle.classList.add('bold-text');

        // Create the scenicCalcDiv and append it to the modal body
        compareScenicCalcModals(opportunityElementOne, opportunityElementTwo);
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

/**
 * Function to compare the previous and current scenic calc array and total working hours and days
 * @param {object} currentData - The current opportunity data
 * @param {object} previousData - The previous opportunity data
 */
function compareOpportunityData(currentData, previousData=null) {
    let currentOpportunityElements = getOpportunityElementObjects(currentData);
    console.log('Current opportunity elements');
    console.log(currentOpportunityElements);

    // Check if there is previous data
    if (previousData !== null) {
        let previousOpportunityElements = getOpportunityElementObjects(previousData);
        console.log('Previous opportunity elements');
        console.log(previousOpportunityElements);
    }
}

/**
 * Function to iterate through the opportunity data and get the required element objects
 * @param {object} opportunityData - The opportunity data
 * @returns {array} - The opportunity element objects
 */
function getOpportunityElementObjects(opportunityData) {
    try {
        if (opportunityData === null) {
            return [];
        } else {
    
            let opportunities = opportunityData.opportunities_with_items;
            let scenicOpportunities = getScenicTagOpportunities(opportunities);
            let activeProducts = opportunityData.active_products;
            let opportunityElements = [];
            let opportunityElement = {};
        
            // Iterate through the current scenic opportunities
            for (let i = 0; i < scenicOpportunities.length; i++) {
                let scenicOpportunity = scenicOpportunities[i];
                let status = scenicOpportunity.opportunity['status'];
                let statusName = scenicOpportunity.opportunity['status_name'];
                let opportunityName = scenicOpportunity.opportunity['subject'];
                let id = scenicOpportunity.opportunity['id'];
                let client = scenicOpportunity.opportunity['member']['name'];
                let opportunityItems = scenicOpportunity.items;
        
                // Check if the opportunity items are in the active products list
                let itemNameArray = confirmItemsExistInActiveProducts(opportunityItems, activeProducts);
        
                // Calculate the total quantity of half hours for each item and convert to hours
                let scenicCalcArray = calculateScenicCalcItemQuantity(itemNameArray);
        
                // Get the total number of hours from the scenic calc array
                let totalHours = calculateTotalHours(scenicCalcArray);
        
                // Get the number of working days from the total hours of the opportunity
                let workingDays = calculateWorkingDays(totalHours);
        
                // Set the start date and time
                let dateAndTime = setOpportunityDateAndTime(scenicOpportunity);
                let startDate = dateAndTime.startDate;
                let startTime = dateAndTime.startTime;
        
                // Set the opportunity type
                let opportunityType = setOpportunityType(scenicOpportunity);
        
                // Create the opportunity element object
                opportunityElement = {
                    'id': id,
                    'opportunityName': opportunityName,
                    'client': client,
                    'startDate': startDate,
                    'startTime': startTime,
                    'status': status,
                    'statusName': statusName,
                    'totalHours': totalHours,
                    'workingDays': workingDays,
                    'scenicCalcArray': scenicCalcArray,
                    'opportunityType': opportunityType
                };
        
                // Append the opportunity element to the opportunityElements array
                opportunityElements.push(opportunityElement);
            }
        
            return opportunityElements;
        }
    } catch (error) {
        console.error('Error in getOpportunityElementObjects:', error);
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the getOpportunityElementObjects function when attempting to get the opportunity element objects: ' + error;
        errorMsgDiv.appendChild(errorMsg);
        return [];
    }
}

/**
 * Function to compare the scenic calc arrays and total hours and working days
 * @param {object} currentOpportunityElement - The most current opportunity element object
 * @param {object} previousOpportunityElement - The previous opportunity element object
 * @returns {object} - The scenic calc div
 */
function compareScenicCalcModals(currentOpportunityElement, previousOpportunityElement) {
    // Assign the scenic calc arrays
    console.log('Inside compareScenicCalcModals');
    let currentScenicCalcArray = currentOpportunityElement.scenicCalcArray;
    
    
    // Check if there is previous data
    if (previousOpportunityElement) {
        let previousScenicCalcArray = previousOpportunityElement.scenicCalcArray;
        console.log('Previous scenic calc array exists');
        // Create a div to display the Scenic Calc items
        let scenicCalcDiv = document.createElement('div');
        scenicCalcDiv.classList.add('card-text');
        
        // Iterate through the scenic calc arrays and compare the quantities
        for (let k = 0; k < currentScenicCalcArray.length; k++) {
            let currentScenicCalcName = currentScenicCalcArray[k].name;
            let currentScenicCalcQuantity = currentScenicCalcArray[k].quantity;
            let matchFound = false;
            let scenicCalcP = document.createElement('p');
            scenicCalcP.classList.add('position-relative');
            for (let l =0; l < previousScenicCalcArray.length; l++) {
                let previousScenicCalcName = previousScenicCalcArray[l].name;
                let previousScenicCalcQuantity = previousScenicCalcArray[l].quantity;
                let quantityDifference = currentScenicCalcQuantity - previousScenicCalcQuantity;
                if (currentScenicCalcName === previousScenicCalcName) {
                    matchFound = true;
                    if (currentScenicCalcQuantity > previousScenicCalcQuantity) {
                        scenicCalcP.innerHTML = `<span class="bold-text">${currentScenicCalcName}:</span> ${currentScenicCalcQuantity} hours
                            <span class="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle click-display-none">
                                <span class="visually-hidden">${quantityDifference}</span>
                            </span>`;
                    } else if (currentScenicCalcQuantity < previousScenicCalcQuantity) {
                        scenicCalcP.innerHTML = `<span class="bold-text">${currentScenicCalcName}:</span> ${currentScenicCalcQuantity} hours
                            <span class="position-absolute top-0 start-100 translate-middle p-2 bg-success border border-light rounded-circle click-display-none">
                                <span class="visually-hidden">${quantityDifference}</span>
                            </span>`;
                    } else {
                        scenicCalcP.innerHTML = `<span class="bold-text">${currentScenicCalcName}:</span> ${currentScenicCalcQuantity} hours`;
                    }
                    scenicCalcDiv.appendChild(scenicCalcP);
                    break;
                }
            }

            if (!matchFound) {
                scenicCalcP.innerHTML = `<span class="bold-text">${currentScenicCalcName}:</span> ${currentScenicCalcQuantity} hours
                    <span class="position-absolute top-0 start-100 translate-middle p-2 bg-warning border border-light rounded-circle">
                        <span class="visually-hidden">New alerts</span>
                    </span>`;
                    scenicCalcDiv.appendChild(scenicCalcP);
            }
        }

        // Get the total hours and working days from the opportunity elements
        let previousTotalHours = previousOpportunityElement.totalHours;
        let currentTotalHours = currentOpportunityElement.totalHours;
        let previousWorkingDays = previousOpportunityElement.workingDays;
        let currentWorkingDays = currentOpportunityElement.workingDays;
        let workingDaysDifference = currentWorkingDays - previousWorkingDays;

        // Add the total hours and working days to the Scenic Calc div
        let totalHoursP = document.createElement('p');
        totalHoursP.classList.add('position-relative');
        if (currentTotalHours > previousTotalHours) {
            totalHoursP.innerHTML = `<span class="bold-text">Total:</span> ${currentTotalHours} hours / ${currentWorkingDays} days
                <span class="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle click-display-none">
                    <span class="visually-hidden">${workingDaysDifference}</span>
                </span>`;
        } else if (currentTotalHours < previousTotalHours) {
            totalHoursP.innerHTML = `<span class="bold-text">Total:</span> ${currentTotalHours} hours / ${currentWorkingDays} days
                <span class="position-absolute top-0 start-100 translate-middle p-2 bg-success border border-light rounded-circle click-display-none">
                    <span class="visually-hidden">${workingDaysDifference}</span>
                </span>`;
        } else {
            totalHoursP.innerHTML = `<span class="bold-text">Total:</span> ${currentTotalHours} hours / ${currentWorkingDays} days`;
        }

        // Set the remaining current opportunity elements
        let currentClientName = currentOpportunityElement.client;
        let currentStartDate = currentOpportunityElement.startDate;
        let currentStartTime = currentOpportunityElement.startTime;
        let currentStatusName = currentOpportunityElement.statusName;
        // let currentOpportunityName = currentOpportunityElement.opportunityName;
    
        // Set the remaining previous opportunity elements
        let previousClientName = previousOpportunityElement.client;
        let previousStartDate = previousOpportunityElement.startDate;
        let previousStartTime = previousOpportunityElement.startTime;
        let previousStatusName = previousOpportunityElement.statusName;
        // let previousOpportunityName = previousOpportunityElement.opportunityName;

        // Get the modal body element
        let modalBody = document.querySelector('#scenicCalcModal .modal-body');
    
        // Clear the modal body before appending the scenicCalcDiv
        modalBody.innerHTML = '';

        // If the client name has changed, update the element styling
        let clientP;
        if (currentClientName !== previousClientName) {
            clientP = updatedModalElements('Client', currentClientName);
        } else {
            clientP = additionalContent('Client', currentClientName);
        }

        // If the start date or start time has changed, update the element styling
        let dateOutP;
        if (currentStartDate !== previousStartDate || currentStartTime !== previousStartTime) {
            dateOutP = updatedModalElements('Date Out', currentStartDate, currentStartTime);
        } else {
            dateOutP = additionalContent('Date Out', currentStartDate, currentStartTime);
        }

        // If the status has changed, update the element styling
        let statusP;
        if (currentStatusName !== previousStatusName) {
            statusP = updatedModalElements('Status', currentStatusName);
        } else {
            statusP = additionalContent('Status', currentStatusName);
        }
    
        // Append the elements to the modal body
        modalBody.appendChild(clientP);
        modalBody.appendChild(dateOutP);
        modalBody.appendChild(statusP);
        modalBody.appendChild(scenicCalcDiv);
        modalBody.appendChild(totalHoursP);

        clickDisplayNone();
    } else {
        console.log('Previous scenic calc array does not exist');
        createScenicCalcDiv(currentOpportunityElement);
    }
}

/**
 * Function to update styling on updated modal elements
 */
function updatedModalElements(string, content, contentTwo=null) {
    let contentP = document.createElement('p');
    contentP.classList.add('position-relative');
    if (contentTwo) {
        contentP.innerHTML = `<span class="bold-text">${string}:</span> ${content}, ${contentTwo}
        <span class="position-absolute top-0 start-100 translate-middle p-2 bg-info border border-light rounded-circle click-display-none">
            <span class="visually-hidden">New alerts</span>
        </span>`;
    } else {
        contentP.innerHTML = `<span class="bold-text">${string}:</span> ${content}
        <span class="position-absolute top-0 start-100 translate-middle p-2 bg-info border border-light rounded-circle click-display-none">
            <span class="visually-hidden">New alerts</span>
        </span>`;
    }

    return contentP;
}

/**
 * Function to se the display to none when the user hovers over the element
 */
function clickDisplayNone() {
    let clickElements = document.querySelectorAll('.click-display-none');
    clickElements.forEach(element => {
        element.addEventListener('click', function() {
            element.style.display = 'none';
        });
    });
}