let overlay = document.getElementById('loading-overlay');
let opportunityData;
let previousOpportunityData = null;  // Variable to store the previous opportunity data
let oppIds;
let previousOppIds = null;

// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    rollingCalendar(91);
    // Retrieve the previous opportunity ids from local storage
    let storedData = localStorage.getItem('previousOppIds');
    try {
        if (storedData && storedData !== "undefined") {
            previousOppIds = JSON.parse(storedData);
        } else {
            previousOppIds = null;
        }
    } catch (error) {
        console.log('Error parsing stored data:', error);
        previousOppIds = null;
    }
    fetchData().then(data => {
        if (!data) {
            console.error('fetchData returned no data');
            return;
        }
        console.log(data);
        opportunityData = getScenicTagOpportunities(data);
        opportunityData = sortOpportunitiesByStartDate(opportunityData);
        console.log(opportunityData);
        previousOpportunityData = createPreviousOpportunityObjects(opportunityData);
        console.log(previousOpportunityData);
        oppIds = getOppIds(opportunityData);
        // compareOpportunityData(opportunityData, previousOpportunityData);
        displayOpportunities(opportunityData, previousOpportunityData, previousOppIds);
        clickDisplayNone();
        previousOppIds = oppIds;
        // Store the previous opportunity data in local storage
        localStorage.setItem('previousOppIds', JSON.stringify(previousOppIds));
    });
    setInterval( () => {
        rollingCalendar(91);
        fetchData().then(data => {
            opportunityData = getScenicTagOpportunities(data);
            opportunityData = sortOpportunitiesByStartDate(opportunityData);
            previousOpportunityData = createPreviousOpportunityObjects(opportunityData);
            oppIds = getOppIds(opportunityData);
            // compareOpportunityData(opportunityData, previousOpportunityData);
            displayOpportunities(opportunityData, previousOpportunityData, previousOppIds);
            clickDisplayNone();
            previousOppIds = oppIds;
            // Update the previous opportunity data in local storage
            localStorage.setItem('previousOppIds', JSON.stringify(previousOppIds));
        });
    }, 2 * 60 * 60 * 1000);
});

/**
 * Function to fetch the data from the API from the backend
 * @returns {Promise} - The data from the API
 * @param {number} days - The number of days to fetch the data for
 */
function fetchData() {
    overlay.style.display = 'flex';
    void overlay.offsetWidth;
    overlay.classList.add('show');

    return fetch(`/workload/get_workshop_workload_data/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.result) {
                throw new Error("No result returned from server.");
            }
            return data.result;
        })
        .catch(error => {
            console.error('Error:', error);
            showError(error);
            return null;
        })
        .finally(() => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.style.display = 'none', 500);
        });
}

/**
 * Polls the status of a background task until it is completed.
 *
 * @param {string} taskId - The unique identifier of the task to be tracked.
 * @returns {Promise<any>} A promise that resolves with the task result upon completion 
 *                         or rejects if an error occurs.
 */
// function pollTaskStatus(taskId) {
//     return new Promise((resolve, reject) => {
//         function checkStatus() {
//             fetch(`/workload/api/check_task_status/${taskId}/`)
//                 .then(response => response.json())
//                 .then(statusData => {
//                     if (statusData.status === "pending") {
//                         setTimeout(checkStatus, 2000);
//                     } else if (statusData.status === "completed") {
//                         console.log("Task successfully completed");
//                         resolve(statusData.result);
//                     } else {
//                         reject(new Error("Task failed or unknown status"));
//                     }
//                 })
//                 .catch(error => reject(error));
//         }
//         checkStatus();
//     });
// }

/**
 * Displays an error message inside the designated error message container.
 *
 * @param {string} error - The error message to display.
 */
function showError(error) {
    const errorMsgDiv = document.querySelector('#api-error-msg');
    errorMsgDiv.innerHTML = ''; // Clear previous errors
    const errorMsg = document.createElement('p');
    errorMsg.textContent = 'An error occurred: ' + error;
    errorMsgDiv.appendChild(errorMsg);
}


/**
 * Function to display the opportunities in the calendar
 * @param {object} currentData - The current opportunity data
 * @param {object} previousData - The previous opportunity data
 */
async function displayOpportunities(currentData, previousData = null, previousOppIds = null) {
    // Check for invalid input
    if (!currentData || !Array.isArray(currentData)) {
        console.error('Invalid input to displayOpportunities: currentData must be an array');
        return;
    }

    try {
        for (const currentOpportunity of currentData) {
            let matchFound = false;
            const {
                opportunity_id: currentOpportunityId,
                custom_input: {date_out: startDate} = {},
                status,
                custom_input: {working_days: workingDays} = {},
                totals: { grand_total: totalHours } = {},
                custom_input: { planned_finish_date: plannedFinish } ={}
            } = currentOpportunity;

            const cell = plannedFinish ? document.getElementById(plannedFinish) : document.getElementById(startDate);

            if (cell && status !== 20 && totalHours > 0) {
                if (previousOppIds) {
                    // console.log('Previous Data exists!');
                    const previousOpportunity = previousData.find(
                        (p) => p.opportunity_id === currentOpportunityId
                    );

                    matchFound = Boolean(previousOpportunity);
                    const unrelatedPrevious = previousData[0];

                    if (matchFound) {
                        // console.log(`MATCH: Current ID ${currentOpportunityId} existed previously`);
                        const { opportunityDiv, startBuildDate, includeWeekends, carpentersInput } = await createOpportunityElement(
                            currentOpportunity, 
                            previousOpportunity, 
                            matchFound
                        );

                        cell.appendChild(opportunityDiv);
                        if (plannedFinish) {
                            setDivStyle(opportunityDiv, status, workingDays, startBuildDate, plannedFinish);
                            attachEventListeners(includeWeekends, carpentersInput, currentOpportunity, cell, startBuildDate, plannedFinish, previousOpportunity, matchFound, true);
                        } else {
                            setDivStyle(opportunityDiv, status, workingDays, startBuildDate, startDate);
                            attachEventListeners(includeWeekends, carpentersInput, currentOpportunity, cell, startBuildDate, startDate, previousOpportunity, matchFound);
                        }
                        adjustTableRowHeights();
                    } else {
                        // console.log(`NO MATCH: Current ID ${currentOpportunityId} is new`);
                        const { opportunityDiv, startBuildDate, includeWeekends, carpentersInput } = await createOpportunityElement(currentOpportunity, unrelatedPrevious, matchFound);
                        cell.appendChild(opportunityDiv);
                        if (plannedFinish) {
                            setDivStyle(opportunityDiv, status, workingDays, startBuildDate, plannedFinish);
                            attachEventListeners(includeWeekends, carpentersInput, currentOpportunity, cell, startBuildDate, plannedFinish, null, matchFound, true);
                        } else {
                            setDivStyle(opportunityDiv, status, workingDays, startBuildDate, startDate);
                            attachEventListeners(includeWeekends, carpentersInput, currentOpportunity, cell, startBuildDate, startDate, null, matchFound);
                        }
                        adjustTableRowHeights();
                    }
                } else {
                    // console.log('No previous data exists!');
                    // If no previousData exists, create a new opportunity
                    const { opportunityDiv, startBuildDate, includeWeekends, carpentersInput } = await createOpportunityElement(currentOpportunity);
                    // console.log(opportunityDiv);
                    cell.appendChild(opportunityDiv);
                    if (plannedFinish) {
                        setDivStyle(opportunityDiv, status, workingDays, startBuildDate, plannedFinish);
	                    attachEventListeners(includeWeekends, carpentersInput, currentOpportunity, cell, startBuildDate, plannedFinish, null, matchFound, true);
                    } else {
                        setDivStyle(opportunityDiv, status, workingDays, startBuildDate, startDate);
                        attachEventListeners(includeWeekends, carpentersInput, currentOpportunity, cell, startBuildDate, startDate, null, matchFound);
                    }
                    adjustTableRowHeights();
                }
            }
        };
    } catch (error) {
        console.error('Error:', error);
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent =
            'An error occurred while running the displayOpportunities function when attempting to display the workload data: ' +
            error;
        errorMsgDiv.appendChild(errorMsg);
    }
}

/**
 * Creates an opportunity element with associated UI components and data attributes.
 *
 * @param {Object} currentOpportunity - The current opportunity data.
 * @param {Object|null} [previousOpportunity=null] - The previous opportunity data, if available.
 * @param {boolean} [matchFound=false] - Indicates whether a matching previous opportunity exists.
 * @returns {Object} - An object containing the created elements:
 *   - {HTMLElement} opportunityDiv - The main div container for the opportunity.
 *   - {HTMLElement} startBuildDate - The start date element, adjusted based on working days.
 *   - {HTMLElement} includeWeekends - The checkbox input for including weekends.
 *   - {Object} carpentersInput - An object containing the carpenter input field and its container.
 */
async function createOpportunityElement(currentOpportunity, previousOpportunity = null, matchFound = false, exists=false) {
    const {
        opportunity_id: currentOpportunityId,
        name: currentOpportunityName,
        status_name: currentStatusName,
        totals: { grand_total: currentTotalHours } = {},
        custom_input: { planned_finish_date: plannedFinish } = {},
        custom_input: { date_out: startDate } = {},
        custom_input: { start_build_date: buildDate } = {}
    } = currentOpportunity;
    const opportunityType = setOpportunityType(currentOpportunity);

    // Create main opportunity div
    const opportunityDiv = document.createElement('div');
    opportunityDiv.id = currentOpportunityId;
    opportunityDiv.setAttribute('data-hire-type', opportunityType);

    // Fetch latest Custom Input data if opportunity already exists
    let customInputData = null;
    if (exists) {
        try{
            const response = await fetch(`/workload/opportunities/${currentOpportunityId}/custom_input/`);
            if (response.ok) {
                customInputData = await response.json();
            } else {
                console.error(`Failed to fetch custom input data for opportunity ${currentOpportunityId}`);
            }
        } catch (err) {
            console.error(`Error fetching custom input data for opportunity ${currentOpportunityId}:`, err);
        }
    }

    const workingDays = exists ? customInputData.working_days : currentOpportunity.custom_input["working_days"];

    // Create child elements
    const { weekendDiv: weekendsCheckboxDiv, includeWeekends } = exists === false ? await createWeekendCheckbox(currentOpportunity) : await createWeekendCheckbox(currentOpportunity, customInputData);
    let startBuildDate = exists ? customInputData.start_build_date : buildDate;
    const originalStartBuildDate = startBuildDate;
    startBuildDate = plannedFinish ? isDateVisible(startBuildDate, plannedFinish) : isDateVisible(startBuildDate, startDate);
    const button = createModalButton(currentTotalHours, workingDays);
    const carpentersInput = exists === false ? await createCarpentersInputField(currentOpportunity, currentTotalHours, button) : await createCarpentersInputField(currentOpportunity, currentTotalHours, button, customInputData);

    // Check if the startBuildDate and startDate are in the same month
    // const {spansMultipleMonths, monthDiff} = checkOpportunityDuration(new Date(startBuildDate), new Date(startDate));

    // if (spansMultipleMonths) {
    //     const monthEndDate = getLastDayOfMonth(startBuildDate);
    //     const previousMonthVisible = getEarliestVisibleDate(monthEndDate);
    //     if (previousMonthVisible) {
    //         createSiblingOpportunity(currentOpportunity, startBuildDate, monthDiff);
    //     }
    //     startBuildDate = getEarliestVisibleDate(startDate);
    // }

    let badge;

    if (previousOpportunity) {
        const {
            name: previousOpportunityName,
            status_name: previousStatusName,
            totals: { grand_total: previousTotalHours } = {}
        } = previousOpportunity;

        const totalHoursDifference = currentTotalHours - previousTotalHours;

        if (currentOpportunityId === 19879) {
            console.log(matchFound);
            console.log(`Current Opportunity Name: ${currentOpportunityName}`);
            console.log(`Current Status Name: ${currentStatusName}`);
            console.log(`Previous Opportunity Name: ${previousOpportunityName}`);
            console.log(`Previous Status Name: ${previousStatusName}`);
        }
        opportunityDiv.innerHTML = matchFound
            ? setInnerHTML(workingDays, currentOpportunityName, matchFound, previousOpportunityName, currentStatusName, previousStatusName)
            : setInnerHTML(workingDays, currentOpportunityName, matchFound);

        badge = matchFound
            ? createModalBadge(matchFound, currentTotalHours, previousTotalHours, totalHoursDifference)
            : createModalBadge(matchFound, currentTotalHours);

        if (matchFound) {
            updateModalContent(button, currentOpportunity, originalStartBuildDate, previousOpportunity);
        } else {
            updateModalContent(button, currentOpportunity, originalStartBuildDate);
        }
    } else {
        opportunityDiv.innerHTML = setInnerHTML(workingDays, currentOpportunityName);
        badge = createModalBadge();
        updateModalContent(button, currentOpportunity, originalStartBuildDate);
    }

    // Assemble elements
    opportunityDiv.appendChild(weekendsCheckboxDiv);
    button.appendChild(badge);
    opportunityDiv.appendChild(carpentersInput.carpentersDiv);
    opportunityDiv.appendChild(button);
    const carpPerDay = plannedFinish ? calculateDailyCarpenters(startBuildDate, plannedFinish, carpentersInput, includeWeekends.checked, true) : calculateDailyCarpenters(startBuildDate, startDate, carpentersInput, includeWeekends.checked);
    addDailyCarpenters(carpPerDay);

   return { opportunityDiv, startBuildDate, includeWeekends, carpentersInput, workingDays };
}

/**
 * Creates a sibling opportunity element in the DOM based on the given opportunity data.
 * If `monthDiff` is greater than 1, multiple sibling elements are created with unique IDs.
 * If `monthDiff` is 1, a single sibling opportunity is added to the calendar.
 *
 * @param {Object} currentOpportunity - The current opportunity object containing details.
 * @param {string} startBuildDate - The starting date (YYYY-MM-DD) for the build process.
 * @param {number} monthDiff - The number of months the sibling opportunities span.
 *
 * @returns {void} - This function does not return a value; it modifies the DOM.
 */
// function createSiblingOpportunity(currentOpportunity, startBuildDate, monthDiff) {
//     const {
// 		id: currentOpportunityId,
// 		opportunityName: currentOpportunityName,
// 		status,
// 		startDate,
// 		opportunityType,
// 		workingDays
// 	} = currentOpportunity;
//     const monthEndDate = getLastDayOfMonth(startBuildDate);
//     const cell = document.getElementById(monthEndDate);
    
//     if (monthDiff > 1) {
//     	for (let i = 1; i <= monthDiff; i++) { // Start from 1 to avoid "id-0"
//         const opportunityDiv = document.createElement("div");
//         opportunityDiv.id = `${currentOpportunityId}-${i}`;

//         // Ensure ID uniqueness before adding
//         if (!document.getElementById(opportunityDiv.id)) {
//             console.log(`Created sibling with ID: ${opportunityDiv.id}`);
//         } else {
//             console.warn(`ID ${opportunityDiv.id} already exists!`);
//         }
//     	}
//     } else {
//     	const opportunityDiv = document.createElement("div");
//         opportunityDiv.style.height = "132.38px";
// 	    opportunityDiv.id = `${currentOpportunityId}-${monthDiff}`;
// 	    opportunityDiv.setAttribute('data-hire-type', opportunityType);
// 	    opportunityDiv.innerHTML = setSiblingInnerHTML(startBuildDate, startDate, currentOpportunityName);
// 	    cell.appendChild(opportunityDiv);
//         startBuildDate = isDateVisible(startBuildDate, monthEndDate);
// 	    setDivStyle(opportunityDiv, status, workingDays, startBuildDate, monthEndDate, currentOpportunityId);
	    // adjustTableRowHeights();
//     }
// }

/**
 * Attaches event listeners to the "Include Weekends" checkbox and the carpenters input field.
 *
 * @param {HTMLElement} includeWeekends - The checkbox input element for including weekends.
 * @param {Object} carpentersInput - An object containing the carpenter input field and its container.
 * @param {Object} currentOpportunity - The current opportunity data.
 * @param {HTMLElement} cell - The table cell element where the opportunity is displayed.
 * @param {string} startBuildDate - The start date of the build for calculating daily carpenters - 'YYYY-MM-DD'.
 * @param {string} startDate - The overall project start date used in carpenter calculations - 'YYYY-MM-DD'.
 * @param {Object|null} [previousOpportunity=null] - The previous opportunity data, if available.
 * @param {boolean} [matchFound=false] - Indicates whether a matching previous opportunity exists.
 */
async function attachEventListeners(includeWeekends, carpentersInput, currentOpportunity, cell, startBuildDate, startDate, previousOpportunity = null, matchFound = false, pfd = false) {
    if (!includeWeekends) {
        console.error("Error: includeWeekends element not found for", currentOpportunity.id);
        return;
    }

    if (!carpentersInput || !carpentersInput.inputField) {
        console.error("Error: carpentersInputField element not found for", currentOpportunity.id);
        return;
    }
    
    let carpPerDay = pfd ? calculateDailyCarpenters(startBuildDate, startDate, carpentersInput, includeWeekends.checked, true) : calculateDailyCarpenters(startBuildDate, startDate, carpentersInput, includeWeekends.checked);

    includeWeekends.addEventListener("change", async () => {
        removeDailyCarpenters(carpPerDay);
        const newState = includeWeekends.checked;
        await updateWeekendsInput(currentOpportunity, newState);
        handleInputChange(carpentersInput, currentOpportunity, cell, previousOpportunity, matchFound);
    });

    carpentersInput.inputField.addEventListener("change", async () => {
        carpPerDay = pfd ? calculateDailyCarpenters(startBuildDate, startDate, carpentersInput, includeWeekends.checked, true) : calculateDailyCarpenters(startBuildDate, startDate, carpentersInput, includeWeekends.checked);
        removeDailyCarpenters(carpPerDay);
        await updateCarpenters(currentOpportunity, carpentersInput.inputField)
        handleInputChange(carpentersInput, currentOpportunity, cell, previousOpportunity, matchFound);
    });
}

/**
 * Handles input changes and updates the opportunity display accordingly.
 *
 * @param {Object} carpentersInput - An object containing the carpenter input field and its container.
 * @param {Object} currentOpportunity - The current opportunity data.
 * @param {HTMLElement} cell - The table cell element where the opportunity is displayed.
 * @param {Object|null} [previousOpportunity=null] - The previous opportunity data, if available.
 * @param {boolean} [matchFound=false] - Indicates whether a matching previous opportunity exists.
 */
async function handleInputChange(carpentersInput, currentOpportunity, cell, previousOpportunity = null, matchFound = false) {
    if (!cell) {
        console.error("Error: cell element not found for startDate:", currentOpportunity.startDate);
        return;
    }

    const carpentersInputField = carpentersInput.inputField;
    if (!carpentersInputField) {
        console.error("Error: carpentersInputField not found for Opportunity ID:", currentOpportunity.id);
        return;
    }

    const {
         opportunity_id: currentOpportunityId,
         custom_input: { date_out: startDate } = {},
         custom_input: { planned_finish_date: plannedFinish } = {},
         status,
    } = currentOpportunity;

    // Remove any existing opportunity divs before appending a new one
    removeOldDivs(currentOpportunityId);

    // Create new opportunity element
    const { opportunityDiv, startBuildDate, includeWeekends, carpentersInput: newCarpentersInput, workingDays } = await createOpportunityElement(
        currentOpportunity, 
        previousOpportunity, 
        matchFound, 
        true
    );

    // Append, style & attach event listeners
    cell.appendChild(opportunityDiv);
    if (plannedFinish) {
        setDivStyle(opportunityDiv, status, workingDays, startBuildDate, plannedFinish);
        attachEventListeners(includeWeekends, newCarpentersInput, currentOpportunity, cell, startBuildDate, plannedFinish, previousOpportunity, matchFound, true);
    } else {
        setDivStyle(opportunityDiv, status, workingDays, startBuildDate, startDate);
        attachEventListeners(includeWeekends, newCarpentersInput, currentOpportunity, cell, startBuildDate, startDate, previousOpportunity, matchFound);
    }
    adjustTableRowHeights();
    clickDisplayNone();
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
            let opportunity = opportunities[i];

            //Check if the opportunity has a scenic tag
            if (opportunity.tags && opportunity.tags.includes('SCENIC')) {
                
                //Add the opportunity to the scenic opportunities array
                scenicOpportunities.push(opportunity);
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
// function confirmItemsExistInActiveProducts(opportunityItems, activeProducts) {
//     // Check if opportunityItems and activeProducts are arrays
//     if (!Array.isArray(opportunityItems) || !Array.isArray(activeProducts)) {
//         console.error('Invalid input to confirmItemsExistInActiveProducts: opportunityItems and activeProducts must be arrays');
//         const errorMsgDiv = document.querySelector('#api-error-msg');
//         const errorMsg = document.createElement('p');
//         errorMsg.textContent = 'An error occurred while running the confirmItemsExistInActiveProducts function: opportunityItems and activeProducts must be arrays';
//         errorMsgDiv.appendChild(errorMsg);
//         return [];
//     }

//     try {
//         let itemNameArray = [];

//         // Iterate through opportunity items and check if they are in the active products list
//         for (let k = 0; k < opportunityItems.length; k++) {
//             let itemName = opportunityItems[k].name;
//             let itemQuantity = opportunityItems[k].quantity;
//             for (let l = 0; l < activeProducts.length; l++) {
//                 let activeProductName = activeProducts[l].name;
//                 if (itemName === activeProductName) {
//                     itemNameArray.push({
//                         'name': itemName,
//                         'quantity': itemQuantity
//                     });
//                 }
//             }
//         }

//         return itemNameArray;
//     } catch (error) {
//         console.error('Error in confirmItemsExistInActiveProducts:', error);
//         const errorMsgDiv = document.querySelector('#api-error-msg');
//         const errorMsg = document.createElement('p');
//         errorMsg.textContent = 'An error occurred while running the confirmItemsExistInActiveProducts function when attempting to confirm the items exist in the active products list: ' + error;
//         errorMsgDiv.appendChild(errorMsg);
//         return [];
//     }
// }

/**
 * Function to calculate the total quantity of half hours for each item and convert to hours
 * @param {array} itemNameArray - The item name array containing an object with the item name and quantity
 * @returns {array} - The scenic calc array containing the item name and quantity in hours
 */
// function calculateScenicCalcItemQuantity(itemNameArray) {
//     // Check if itemNameArray is an array
//     if (!Array.isArray(itemNameArray)) {
//         console.error('Invalid input to calculateScenicCalcItemQuantity: itemNameArray must be an array');
//         const errorMsgDiv = document.querySelector('#api-error-msg');
//         const errorMsg = document.createElement('p');
//         errorMsg.textContent = 'An error occurred while running the calculateScenicCalcItemQuantity function: itemNameArray must be an array';
//         errorMsgDiv.appendChild(errorMsg);
//         return [];
//     }

//     try {
//         let scenicCalcArray = [];

//         // Iterate through the item name array and calculate the total quantity of each item
//         for (let i = 0; i < itemNameArray.length; i++) {
//             const currentItemId = itemNameArray[i].current_item_id;
//             const itemName = itemNameArray[i].name.split("-")[0].trim();
//             const itemQuantity = itemNameArray[i].item_total;
//             const previousItemQuantity = itemNameArray[i].previous_item_total;
//             const itemUpdatedAt = itemNameArray[i].item_updated_at;
//             const itemPreviouslyUpdatedAt = itemNameArray[i].item_previously_updated_at;


//             scenicCalcArray.push({
//                 'current_item_id': currentItemId,
//                 'name': itemName,
//                 'quantity': parseFloat(itemQuantity) / 2,
//                 'previous_quantity': parseFloat(previousItemQuantity) / 2,
//                 'item_updated_at': itemUpdatedAt,
//                 'item_previously_updated_at': itemPreviouslyUpdatedAt,
//             });
            
//         }

//         return scenicCalcArray;

//     } catch (error) {
//         console.error('Error in calculateScenicCalcItemQuantity:', error);
//         const errorMsgDiv = document.querySelector('#api-error-msg');
//         const errorMsg = document.createElement('p');
//         errorMsg.textContent = 'An error occurred while running the calculateScenicCalcItemQuantity function when attempting to calculate the total quantity of each item: ' + error;
//         errorMsgDiv.appendChild(errorMsg);
//         return [];
//     }
// }

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
 * @param {number} carpentersInput - The number of carpenters input
 * @returns {number} - The number of working days
 */
async function calculateWorkingDays(totalHours, carpentersInput) {
    // Check the total hours is a number
    if (isNaN(totalHours)) {
        console.error('Invalid input to calculateWorkingDays: totalHours must be a number');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the calculateWorkingDays function: totalHours must be a number';
        errorMsgDiv.appendChild(errorMsg);
        return 0;
    }

    // Check the carpenters input is a number and is greater than 0
    if (isNaN(carpentersInput) || carpentersInput <= 0) {
        console.error('Invalid input to calculateWorkingDays: carpentersInput must be a number greater than 0');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the calculateWorkingDays function: carpentersInput must be a number greater than 0';
        errorMsgDiv.appendChild(errorMsg);
        return 0;
    }

    const workingHalfDays = Math.ceil((totalHours / 4) / carpentersInput);
    const workingDays = workingHalfDays / 2;

    return workingDays;
}

/**
 * Function to create a div to display the Scenic Calc items and other opportunity details
 * @param {array} calcArray - The scenic calc array containing the item name and quantity in hours
 * @param {string} startBuildDate - The date that the build must start
 */
function createScenicCalcDiv(opportunityElement, startBuildDate) {
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
    if (!opportunityElement.items || !Array.isArray(opportunityElement.items) || !opportunityElement.client || !opportunityElement.custom_input["date_out"] || !opportunityElement.custom_input["time_out"] || !opportunityElement.status_name || typeof opportunityElement.totals["grand_total"] !== 'number' || typeof opportunityElement.custom_input["working_days"] !== 'number') {
        console.error('Invalid input to createScenicCalcDiv: opportunityElement must have the required properties');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the createScenicCalcDiv function: opportunityElement must have the required properties';
        errorMsgDiv.appendChild(errorMsg);
        return {};
    }   

    try {
        const id = opportunityElement.opportunity_id;
        const calcArray = opportunityElement.items;
        const client = opportunityElement.client;
        const startDate = opportunityElement.custom_input["date_out"];
        const startTime = opportunityElement.custom_input["time_out"];
        const status = opportunityElement.status_name;
        const totalHours = opportunityElement.totals["grand_total"];
        const workingDays = opportunityElement.custom_input["working_days"];
        const plannedFinishDate = opportunityElement.custom_input["planned_finish_date"] || "N/A";
        const includeWeekends = opportunityElement.custom_input["include_weekends"] === true ? "Yes" : "No";
        const numOfCarpenters = opportunityElement.custom_input["num_of_carpenters"];

        // Create a div to display the Scenic Calc items
        const scenicCalcDiv = document.createElement('div');
        scenicCalcDiv.classList.add('card-text');
        for (let i = 0; i < calcArray.length; i++) {
            const scenicCalcName = calcArray[i].name;
            const scenicCalcQuantity = calcArray[i].item_total;
            const scenicCalcP = document.createElement('p');
            scenicCalcP.classList.add('position-relative');
            scenicCalcP.innerHTML = `<span class="bold-text">${scenicCalcName}:</span> ${scenicCalcQuantity} hours`;
            scenicCalcDiv.appendChild(scenicCalcP);
        }

        // Add the total hours and working days to the Scenic Calc div
        const totalHoursP = document.createElement('p');
        totalHoursP.classList.add('position-relative');
        totalHoursP.innerHTML = `<span class="bold-text">Total:</span> ${totalHours} hours / ${workingDays} days`;

        // Add other elements to the modal body
        const clientP = additionalContent('Client', `client-name-${id}`, client);
        const dateOutP = additionalContent('Date Out', `date-out-${id}`, startDate, startTime);
        const startBuildDateP = additionalContent('Start Build Date', `start-build-date-${id}`, startBuildDate);
        const statusP = additionalContent('Status', `status-${id}`, status);
        const plannedFinishDateP = additionalContent('Planned Finish Date', `planned-finish-date-${id}`, plannedFinishDate);
        const includeWeekendsP = additionalContent('Include Weekends', `include-weekends-${id}`, includeWeekends);
        const numOfCarpentersP = additionalContent('Number of Carpenters', `num-of-carpenters-${id}`, numOfCarpenters);

        // Get the modal body element
        const modalBody = document.querySelector('#scenicCalcModal .modal-body');

        // Clear the modal body before appending the scenicCalcDiv
        modalBody.innerHTML = '';

        // Append the elements to the modal body
        modalBody.appendChild(clientP);
        modalBody.appendChild(dateOutP);
        modalBody.appendChild(startBuildDateP);
        modalBody.appendChild(plannedFinishDateP);
        modalBody.appendChild(includeWeekendsP);
        modalBody.appendChild(numOfCarpentersP);
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
    if (typeof opportunityEvent !== 'object') {
        console.error('Invalid input to setOpportunityDateAndTime: opportunityEvent must be an object');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the setOpportunityDateAndTime function: opportunityEvent must be an object';
        errorMsgDiv.appendChild(errorMsg);
        return { startDate: '', startTime: '' };
    }

    try {
        let startDate;
        let startTime;
        let loadStartsAt;

        // Set the start date and time
        if (opportunityEvent.load_starts_at !== null) {
            startDate = opportunityEvent.load_starts_at.split('T')[0];
            loadStartsAt = new Date(opportunityEvent.load_starts_at);
            startTime = loadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } else if (opportunityEvent.deliver_starts_at !== null) {
            startDate = opportunityEvent.deliver_starts_at.split('T')[0];
            loadStartsAt = new Date(opportunityEvent.deliver_starts_at);
            startTime = loadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } else {
            startDate = opportunityEvent.starts_at.split('T')[0];
            loadStartsAt = new Date(opportunityEvent.starts_at);
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
    if (typeof opportunityEvent !== 'object') {
        console.error('Invalid input to setOpportunityType: opportunityEvent must be an object');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the setOpportunityType function: opportunityEvent must be an object';
        errorMsgDiv.appendChild(errorMsg);
        return '';
    }

    try {
        let opportunityType;

        // Set the opportunity type
        if (opportunityEvent.dry_hire === 'Yes') {
            opportunityType = 'Dry Hire';
        } else if (opportunityEvent.dry_hire_transport === 'Yes') {
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

    // Map of month numbers to month names
    let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Get unique months
    let uniqueMonths = new Set(rollingDates.map(date => monthNames[date.getMonth()]));

    // Get the tbody
    let tbody = document.querySelector('#scenic-calendar tbody');
    // Set the rows
    let rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        if (uniqueMonths.has(row.id)) {
            row.classList.remove('display-none');
            let yearMonth = rollingDates.find(date => monthNames[date.getMonth()] === row.id);
            if (yearMonth) {
                let year = yearMonth.getFullYear();
                let month = ('0' + (yearMonth.getMonth() + 1)).slice(-2); // Get month in "MM" format
                row.setAttribute('data-year-month', `${year}${month}`);
            }
        }
    }

    // Sort the rows
    let sortedRows = Array.from(rows).sort((a, b) => a.getAttribute('data-year-month') - b.getAttribute('data-year-month'));
    for (let row of sortedRows) {
        tbody.appendChild(row);
    }

    // Assign dates to the td elements
    for (let date of rollingDates) {
        let row = document.getElementById(monthNames[date.getMonth()]);
        if (row) {
            let cells = row.getElementsByClassName('cell-border');
            let day = date.getDate() - 1;
            if (cells[day]) {
                cells[day].id = date.toISOString().split('T')[0];

                // Set the inner HTML of the cell
                let dayNum = date.getDate();
                let monthShort = date.toLocaleString('default', {month: 'short'});
                let weekday = date.toLocaleString('default', {weekday: 'short'});
                cells[day].innerHTML = `<p class="mb-1 date">${weekday} ${dayNum} ${monthShort}</p>`;
                cells[day].classList.add('position-relative');
                cells[day].classList.remove('display-none');

                const carpDiv = createDailyCarpentersDiv(cells[day].id);
                cells[day].appendChild(carpDiv);
            }
        }
    }
}

/**
 * Creates a new <div> element representing the daily required carpenters for a specific item.
 *
 * @param {string|number} id - A unique identifier used to set the `id` attribute of the created <div>.
 * @returns {HTMLDivElement} A <div> element with:
 *   - Inner HTML containing a paragraph with the text "Req. Carpenters: 0"
 *   - A <span> element with the `id` in the format `dailyCarp-{id}` for dynamically updating the number
 */
function createDailyCarpentersDiv(id) {
    const dailyCarpDiv = document.createElement('div');
    dailyCarpDiv.innerHTML = `<p>Req. Carpenters: <span id="dailyCarp-${id}">0</span></p>`
    return dailyCarpDiv;
}

/**
 * Function to get all the buttons with the class 'openModalButton'
 * and add an event listener to each button to update the modal
 * @param {HTMLButtonElement} button - The HTML button element
 * @param {object} opportunityElementOne - The first opportunity element object
 * @param {string} startBuildDate - The date that the build must start
 * @param {object} opportunityElementTwo - The second opportunity element object
 */
function updateModalContent(button, opportunityElementOne, startBuildDate, opportunityElementTwo=null) {
    // const id = opportunityElementOne.opportunity_id;
    button.addEventListener('click', function() {
        // Get the opportunity name
        const opportunityName = this.parentElement.querySelector('.badge').textContent;

        // Get the modal title element
        const modalTitle = document.querySelector('#scenicCalcModal .modal-title');

        // Set the modal title
        modalTitle.textContent = opportunityName;
        modalTitle.classList.add('bold-text');

        // Create the scenicCalcDiv and append it to the modal body
        compareScenicCalcModals(opportunityElementOne, startBuildDate, opportunityElementTwo);
        openOpportunity(opportunityElementOne);
    });
}

/**
 * Function to create buttons to open the opportunity in a new tab or close the modal
 * @param {number} id - The opportunity ID
 */
function openOpportunity(opportunity) {
    const id = opportunity.opportunity_id;
    const anchor = document.createElement('a');
    anchor.href = `https://lfps.current-rms.com/opportunities/${id}`;
    anchor.target = '_blank';
    anchor.className = 'btn btn-primary';
    anchor.textContent = 'Open in Current RMS';

    const saveButton = document.createElement('button');
    saveButton.id = 'save-button';
    saveButton.type = 'button';
    saveButton.className = 'btn btn-success d-none';
    saveButton.textContent = 'Save';

    const editButton = document.createElement('button');
    editButton.id = 'edit-button';
    editButton.type = 'button';
    editButton.className = 'btn btn-info';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => enableEditing(opportunity));

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn btn-secondary';
    closeButton.setAttribute('data-bs-dismiss', 'modal');
    closeButton.textContent = 'Close';

    const errorBox = document.createElement('div');
    errorBox.id = "scenicCalcError";
    errorBox.className = "mt-2 text-danger small d-none";

    // Get modal footer element
    const modalFooter = document.querySelector('#scenicCalcModal .modal-footer');

    // Clear the modal footer before appending the anchor
    modalFooter.innerHTML = '';

    // Append the anchor to the modal footer
    modalFooter.appendChild(errorBox);
    modalFooter.appendChild(anchor);
    modalFooter.appendChild(saveButton);
    modalFooter.appendChild(editButton);
    modalFooter.appendChild(closeButton);
}

function enableEditing(opportunity) {
    const id = opportunity.opportunity_id;
    const modalBody = document.querySelector('#scenicCalcModal .modal-body');

    const numCarpentersElem = modalBody.querySelector(`#num-of-carpenters-${id}`);
    const includeWeekendsElem = modalBody.querySelector(`#include-weekends-${id}`);
    const plannedFinishElem = modalBody.querySelector(`#planned-finish-date-${id}`);

    const currentNum = numCarpentersElem.textContent.trim();
    const currentInclude = includeWeekendsElem.textContent.trim().toLowerCase() === 'yes';
    const currentPlanned = plannedFinishElem.textContent.trim();
    const safeDate = normaliseDateString(currentPlanned);

    numCarpentersElem.innerHTML = `
        <input id="edit-num-carpenters-${id}" type="number" min="1"
               class="form-control form-control-sm"
               value="${currentNum || 1}">
    `;
    includeWeekendsElem.innerHTML = `
        <input id="edit-include-weekends-${id}" type="checkbox"
               ${currentInclude ? 'checked' : ''}>
    `;
    plannedFinishElem.innerHTML = `
        <input id="edit-planned-finish-date-${id}" type="date"
               class="form-control form-control-sm"
               value="${safeDate}">
    `;

    const editButton = document.getElementById('edit-button');
    editButton.classList.add('d-none');
    const saveButton = document.getElementById('save-button');
    saveButton.classList.remove('d-none');
    // editButton.replaceWith(editButton.cloneNode(true));
    // const newButton = document.querySelector('.btn-success');
    // newButton.addEventListener('click', () => saveEdits(opportunity));

    saveButton.onclick = () => saveEdits(opportunity, saveButton);

    const plannedFinishInput = document.querySelector(`#edit-planned-finish-date-${id}`);
    const errorBox = document.getElementById("scenicCalcError");

    plannedFinishInput.addEventListener('input', () => {
        plannedFinishInput.classList.remove('is-invalid');
        errorBox.classList.add('d-none');
        errorBox.textContent = '';
        console.log(`Planned Finish date: ${plannedFinishInput.value}`);
    });
}

async function saveEdits(opportunity, button) {
    const {
        opportunity_id: id,
        totals: {grand_total: totalHours} = {},
        custom_input: { date_out: startDate } = {},
    } = opportunity;
    const editButton = document.getElementById('edit-button');
    button.disabled = true;
    button.textContent = 'Saving...';

    const numCarpentersValue = document.querySelector(`#edit-num-carpenters-${id}`).value;
    const numCarpenters = numCarpentersValue ? parseInt(numCarpentersValue, 10) : 1;
    const includeWeekends = document.querySelector(`#edit-include-weekends-${id}`).checked;
    const plannedFinishElm = document.querySelector(`#edit-planned-finish-date-${id}`);
    let plannedFinish = plannedFinishElm.value;
    console.log(`Planned Finish Date in saveEdits: ${plannedFinish}`);
    const workingDays = await calculateWorkingDays(totalHours, numCarpenters);

    const scenicModalEl = document.getElementById('scenicCalcModal');
    const scenicModal = bootstrap.Modal.getInstance(scenicModalEl);

    const plannedFinishInput = document.querySelector(`#edit-planned-finish-date-${id}`);
    const errorBox = document.getElementById('scenicCalcError');

    plannedFinishInput.classList.remove('is-invalid');
    errorBox.classList.add('d-none');
    errorBox.textContent = '';

    const plannedFinishDate = plannedFinish ? new Date(plannedFinish) : null;
    const startDateObj = new Date(startDate);

    if (plannedFinishDate && plannedFinishDate >= startDateObj) {
        plannedFinishInput.classList.add('is-invalid');
        errorBox.textContent = 'Planned finish date must be before the start date.';
        errorBox.classList.remove('d-none');

        button.disabled = false;
        button.textContent = 'Save';
        return;
    }

    let startBuildDate;
    if (plannedFinish) {
        plannedFinish = new Date(plannedFinish).toISOString().split('T')[0];
        startBuildDate = createStartBuildDate(workingDays, plannedFinish, includeWeekends, true)
    } else {
        plannedFinish = null;
        startBuildDate = createStartBuildDate(workingDays, startDate, includeWeekends)
    }

    try {
        const response = await fetch(`/workload/opportunities/${id}/custom_input/` , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                num_of_carpenters: numCarpenters,
                include_weekends: includeWeekends,
                planned_finish_date: plannedFinish,
                working_days: workingDays,
                start_build_date: startBuildDate,
            }),
        });

        if (scenicModal) {
                scenicModal.hide();
            }

        if (response.ok) {
            const data = await response.json();
            console.log('Updated successfully:', data.updated_data);
            showMessageModal('Opportunity updated successfully');
            const messageModalEl = document.getElementById('messageModal');

            messageModalEl.addEventListener(
                'hidden.bs.modal',
                () => window.location.reload(),
                { once: true }
            );
        } else {
            console.error('Failed to save changes.');
            showMessageModal('Failed to save changes');
        }
    } catch (err) {
        console.error('Error saving changes: ', err);
        showMessageModal('Error saving changes');
    } finally {
        button.disabled = false;
        button.classList.add('d-none');
        editButton.classList.remove('d-none');
        button.onclick = () => enableEditing(opportunity);
    }
}

function normaliseDateString(str) {
    if (!str) {
        console.log("Not a string!");
        return "";
    }
    // Reject non-date placeholders
    if (str === "N/A" || str === "None" || str === "-" || str === "null") {
        console.log("Not a valid value");
        console.log(`String value: ${str}`);
        return "";
    }
    // If already valid yyyy-mm-dd, keep it
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        console.log("Vaild!");
        return str
    };
    
    console.log("Did not match any validations, returning empty");
    return "";
}

/**
 * Function to add additional content to the modal
 */
function additionalContent(string, idString, content, contentTwo=null) {
    const contentP = document.createElement('p');
    if (contentTwo) {
        contentP.innerHTML = `<span class="bold-text">${string}: </span><span id="${idString}">${content}, ${contentTwo}</span>`
    } else{
        contentP.innerHTML = `<span class="bold-text">${string}: </span><span id="${idString}">${content}</span>`
    }

    return contentP;
}

/**
 * Function to compare the previous and current scenic calc array and total working hours and days
 * @param {object} currentData - The current opportunity data
 * @param {object} previousData - The previous opportunity data
 */
// function compareOpportunityData(currentData, previousData=null) {
//     let currentOpportunityElements = currentData;
//     console.log('Current opportunity elements');
//     console.log(currentOpportunityElements);

//     // Check if there is previous data
//     if (previousData !== null) {
//         let previousOpportunityElements = previousData;
//         console.log('Previous opportunity elements');
//         console.log(previousOpportunityElements);
//     }
// }

/**
 * Function to iterate through the opportunity data and get the required element objects
 * @param {object} opportunityData - The opportunity data
 * @returns {array} - The opportunity element objects
 */
// function getOpportunityElementObjects(opportunityData) {
//     try {
//         if (opportunityData === null) {
//             return [];
//         } else {
//             let scenicOpportunities = getScenicTagOpportunities(opportunityData);
//             let opportunityElements = [];
//             let opportunityElement = {};

//             // Iterate through the current scenic opportunities
//             for (let i = 0; i < scenicOpportunities.length; i++) {
//                 let scenicOpportunity = scenicOpportunities[i];
//                 let status = scenicOpportunity.status;
//                 let statusName = scenicOpportunity.status_name;
//                 let opportunityName = scenicOpportunity.name;
//                 let id = scenicOpportunity.opportunity_id;
//                 let client = scenicOpportunity.client;
//                 let opportunityItems = scenicOpportunity.items;
//                 const num_of_carpenters = scenicOpportunity.custom_input['num_of_carpenters']
//                 const grand_total_hrs = scenicOpportunity.totals['grand_total'] / 2
//                 const prev_grand_total_hrs = scenicOpportunity.totals['previous_grand_total'] / 2

//                 // Calculate the total quantity of half hours for each item and convert to hours
//                 let scenicCalcArray = calculateScenicCalcItemQuantity(opportunityItems);

//                 // Create the carpenters input field
//                 let carpentersInput = createCarpentersInputField(id, num_of_carpenters);
//                 let carpentersInputValue = carpentersInput.inputValue;
//                 let carpentersInputField = carpentersInput.inputField;

//                 // Create the include weekends checkbox
//                 let weekendsInput = createWeekendCheckbox(id);
//                 let includeWeekends = weekendsInput.includeWeekends;

//                 // Get the number of working days from the total hours of the opportunity
//                 let workingDays = calculateWorkingDays(grand_total_hrs, carpentersInputValue);

//                 // Set the start date and time
//                 const dateAndTime = setOpportunityDateAndTime(scenicOpportunity);
//                 const startDate = dateAndTime.startDate;
//                 const startTime = dateAndTime.startTime;

//                 // Set the opportunity type
//                 const opportunityType = setOpportunityType(scenicOpportunity);

//                 // Create the opportunity element object
//                 opportunityElement = {
//                     'id': id,
//                     'opportunityName': opportunityName,
//                     'client': client,
//                     'startDate': startDate,
//                     'startTime': startTime,
//                     'status': status,
//                     'statusName': statusName,
//                     'numberOfCarpenters': carpentersInputValue,
//                     'carpentersInputField': carpentersInputField,
//                     'includeWeekends': includeWeekends,
//                     'totalHours': grand_total_hrs,
//                     'workingDays': workingDays,
//                     'scenicCalcArray': scenicCalcArray,
//                     'opportunityType': opportunityType
//                 };

//                 // Append the opportunity element to the opportunityElements array
//                 opportunityElements.push(opportunityElement);
//             }
//             return opportunityElements;
//         }
//     } catch (error) {
//         console.error('Error in getOpportunityElementObjects:', error);
//         const errorMsgDiv = document.querySelector('#api-error-msg');
//         const errorMsg = document.createElement('p');
//         errorMsg.textContent = 'An error occurred while running the getOpportunityElementObjects function when attempting to get the opportunity element objects: ' + error;
//         errorMsgDiv.appendChild(errorMsg);
//         return [];
//     }
// }

/**
 * Function to compare the scenic calc arrays and total hours and working days
 * @param {object} currentOpportunityElement - The most current opportunity element object
 * @param {string} startBuildDate - The date that the build must start
 * @param {object} previousOpportunityElement - The previous opportunity element object
 */
function compareScenicCalcModals(currentOpportunityElement, startBuildDate, previousOpportunityElement) {
    const id = currentOpportunityElement.opportunity_id;
    // Assign the scenic calc arrays
    const currentScenicCalcArray = currentOpportunityElement.items;
    
    // Check if there is previous data
    if (previousOpportunityElement) {
        const previousScenicCalcArray = previousOpportunityElement.items;

        // Create a div to display the Scenic Calc items
        const scenicCalcDiv = document.createElement('div');
        scenicCalcDiv.classList.add('card-text');
        
        // Iterate through the scenic calc arrays and compare the quantities
        for (let i = 0; i < currentScenicCalcArray.length; i++) {
            const currentScenicCalcName = currentScenicCalcArray[i].name;
            const currentScenicCalcQuantity = currentScenicCalcArray[i].item_total;
            let matchFound = false;
            let scenicCalcP = document.createElement('p');
            scenicCalcP.classList.add('position-relative');
            for (let j =0; j < previousScenicCalcArray.length; j++) {
                const previousScenicCalcName = previousScenicCalcArray[j].name;
                const previousScenicCalcQuantity = previousScenicCalcArray[j].item_total;
                const quantityDifference = currentScenicCalcQuantity - previousScenicCalcQuantity;
                if (currentScenicCalcName === previousScenicCalcName) {
                    matchFound = true;
                    if (currentScenicCalcQuantity > previousScenicCalcQuantity) {
                        scenicCalcP.innerHTML = `<span class="bold-text">${currentScenicCalcName}:</span> ${currentScenicCalcQuantity} hours
                            <span class="position-absolute top-0 end-0 badge rounded-pill bg-danger click-display-none">
                                <span>+${quantityDifference}</span>
                            </span>`;
                    } else if (currentScenicCalcQuantity < previousScenicCalcQuantity) {
                        scenicCalcP.innerHTML = `<span class="bold-text">${currentScenicCalcName}:</span> ${currentScenicCalcQuantity} hours
                            <span class="position-absolute top-0 end-0 badge rounded-pill bg-success click-display-none">
                                <span>${quantityDifference}</span>
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
                    <span class="position-absolute top-0 end-0 badge rounded-pill bg-warning click-display-none">
                        <span>New</span>
                    </span>`;
                    scenicCalcDiv.appendChild(scenicCalcP);
            }
        }

        // Get the total hours and working days from the opportunity elements
        const previousTotalHours = previousOpportunityElement.totals["grand_total"];
        const currentTotalHours = currentOpportunityElement.totals["grand_total"];
        const previousWorkingDays = previousOpportunityElement.custom_input["working_days"];
        const currentWorkingDays = currentOpportunityElement.custom_input["working_days"];
        const workingDaysDifference = currentWorkingDays - previousWorkingDays;

        // Add the total hours and working days to the Scenic Calc div
        let totalHoursP = document.createElement('p');
        totalHoursP.classList.add('position-relative');
        if (currentTotalHours > previousTotalHours) {
            totalHoursP.innerHTML = `<span class="bold-text">Total:</span> ${currentTotalHours} hours / ${currentWorkingDays} days
                <span class="position-absolute top-0 end-0 badge rounded-pill bg-danger click-display-none">
                    <span>+${workingDaysDifference} days</span>
                </span>`;
        } else if (currentTotalHours < previousTotalHours) {
            totalHoursP.innerHTML = `<span class="bold-text">Total:</span> ${currentTotalHours} hours / ${currentWorkingDays} days
                <span class="position-absolute top-0 end-0 badge rounded-pill bg-success click-display-none">
                    <span>${workingDaysDifference} days</span>
                </span>`;
        } else {
            totalHoursP.innerHTML = `<span class="bold-text">Total:</span> ${currentTotalHours} hours / ${currentWorkingDays} days`;
        }

        const previousNumOfCarpenters = previousOpportunityElement.custom_input["previous_num_of_carpenters"];
        const currentNumOfCarpenters = currentOpportunityElement.custom_input["num_of_carpenters"]
        const numOfCarpentersDiff = currentNumOfCarpenters - previousNumOfCarpenters;
        let numOfCarpentersP = document.createElement('p');
        if (currentNumOfCarpenters > previousNumOfCarpenters) {
            numOfCarpentersP.innerHTML = `<span class="bold-text">Number of Carpenters:</span><span id="num-of-carpenters-${id}"> ${currentNumOfCarpenters}</span>
                <span class="position-absolute top-0 end-0 badge rounded-pill bg-danger click-display-none">
                    <span>+${numOfCarpentersDiff} days</span>
                </span>`;
        } else if (currentNumOfCarpenters < previousNumOfCarpenters) {
            numOfCarpentersP.innerHTML = `<span class="bold-text">Number of Carpenters:</span><span id="num-of-carpenters-${id}"> ${currentNumOfCarpenters}</span>
                <span class="position-absolute top-0 end-0 badge rounded-pill bg-success click-display-none">
                    <span>${numOfCarpentersDiff} days</span>
                </span>`;
        } else {
            numOfCarpentersP.innerHTML = `<span class="bold-text">Number of Carpenters:</span><span id="num-of-carpenters-${id}"> ${currentNumOfCarpenters}</span>`;
        }

        // Set the remaining current opportunity elements
        const currentClientName = currentOpportunityElement.client;
        const currentStartDate = currentOpportunityElement.custom_input["date_out"];
        const currentStartTime = currentOpportunityElement.custom_input["time_out"];
        const currentStatusName = currentOpportunityElement.status_name;
        const currentIncludeWeekends = currentOpportunityElement.custom_input["include_weekends"] === true ? "Yes" : "No";
        const currentPlannedFinishDate = currentOpportunityElement.custom_input["planned_finish_date"] || "N/A";
    
        // Set the remaining previous opportunity elements
        const previousClientName = previousOpportunityElement.client;
        const previousStartDate = previousOpportunityElement.custom_input["date_out"];
        const previousStartTime = previousOpportunityElement.custom_input["time_out"];
        const previousStatusName = previousOpportunityElement.status_name;
        const previousIncludeWeekends = previousOpportunityElement.custom_input["include_weekends"] === true ? "Yes" : "No";
        const previousPlannedFinishDate = previousOpportunityElement.custom_input["planned_finish_date"] || "N/A";

        // Get the modal body element
        let modalBody = document.querySelector('#scenicCalcModal .modal-body');
    
        // Clear the modal body before appending the scenicCalcDiv
        modalBody.innerHTML = '';

        // If the client name has changed, update the element styling
        let clientP;
        if (currentClientName !== previousClientName) {
            clientP = updatedModalElements('Client', `client-name-${id}`, currentClientName);
        } else {
            clientP = additionalContent('Client', `client-name-${id}`, currentClientName);
        }

        // If the start date or start time has changed, update the element styling
        let dateOutP;
        if (currentStartDate !== previousStartDate || currentStartTime !== previousStartTime) {
            dateOutP = updatedModalElements('Date Out', `date-out-${id}`, currentStartDate, currentStartTime);
        } else {
            dateOutP = additionalContent('Date Out', `date-out-${id}`, currentStartDate, currentStartTime);
        }

        let startBuildDateP = additionalContent('Start Build Date', `start-build-date-${id}`, startBuildDate);

        // If the status has changed, update the element styling
        let statusP;
        if (currentStatusName !== previousStatusName) {
            statusP = updatedModalElements('Status', `status-${id}`, currentStatusName);
        } else {
            statusP = additionalContent('Status', `status-${id}`, currentStatusName);
        }

        // If the include weekends has changed, update the element styling
        let includeWeekendsP;
        if (currentIncludeWeekends !== previousIncludeWeekends) {
            includeWeekendsP = updatedModalElements('Include Weekends', `include-weekends-${id}`, currentIncludeWeekends);
        } else {
            includeWeekendsP = additionalContent('Include Weekends', `include-weekends-${id}`, currentIncludeWeekends);
        }

        // If the planned finish date has changed, update the element styling
        let plannedFinishDateP;
        if (currentPlannedFinishDate !== previousPlannedFinishDate) {
            plannedFinishDateP = updatedModalElements('Planned Finish Date', `planned-finish-date-${id}`, currentPlannedFinishDate);
        } else {
            plannedFinishDateP = additionalContent('Planned Finish Date', `planned-finish-date-${id}`, currentPlannedFinishDate);
        }
    
        // Append the elements to the modal body
        modalBody.appendChild(clientP);
        modalBody.appendChild(dateOutP);
        modalBody.appendChild(startBuildDateP);
        modalBody.appendChild(plannedFinishDateP);
        modalBody.appendChild(includeWeekendsP);
        modalBody.appendChild(numOfCarpentersP);
        modalBody.appendChild(statusP);
        modalBody.appendChild(scenicCalcDiv);
        modalBody.appendChild(totalHoursP);

        clickDisplayNone();
    } else {
        createScenicCalcDiv(currentOpportunityElement, startBuildDate);
    }
}

/**
 * Function to update styling on updated modal elements
 */
function updatedModalElements(string, idString, content, contentTwo=null) {
    let contentP = document.createElement('p');
    contentP.classList.add('position-relative');
    if (contentTwo) {
        contentP.innerHTML = `<span class="bold-text">${string}:</span><span id="${idString}"> ${content}, ${contentTwo}</span>
        <span class="position-absolute top-0 end-0 p-2 bg-info border border-light rounded-circle click-display-none">
            <span class="visually-hidden">New alerts</span>
        </span>`;
    } else {
        contentP.innerHTML = `<span class="bold-text">${string}:</span><span id="${idString}"> ${content}</span>
        <span class="position-absolute top-0 end-0 p-2 bg-info border border-light rounded-circle click-display-none">
            <span class="visually-hidden">New alerts</span>
        </span>`;
    }

    return contentP;
}

/**
 * Function to create an input field for the number of carpenters working on the event
 * @param {number} id - The ID of the event
 * @param {number} totalHours - The total number of hours
 * @param {object} button - The button element
 * @returns {object} - The div element and input field value
 */
async function createCarpentersInputField(opportunity, totalHours=null, button=null, customInputData=null) {
    const id = opportunity.opportunity_id

    // Create a div to hold the input field
    let numCarpentersDiv = document.createElement('div');
    numCarpentersDiv.classList.add('mb-1');

    // Create the label
    let numCarpentersLabel = document.createElement('label');
    numCarpentersLabel.htmlFor = `carpenters-${id}`;
    numCarpentersLabel.classList.add('text-white', 'me-1');
    numCarpentersLabel.textContent = 'No. of Carpenters';

    // Create the input
    let numCarpentersInput = document.createElement('input');
    numCarpentersInput.type = 'number';
    numCarpentersInput.id = `carpenters-${id}`;
    numCarpentersInput.name = `carpenters-${id}`;
    numCarpentersInput.min = '1';
    numCarpentersInput.max = '20';
    numCarpentersInput.value = '';

    const savedValue = customInputData ? customInputData.num_of_carpenters : opportunity.custom_input?.num_of_carpenters;

    // Apply a default if none found
    numCarpentersInput.value = savedValue ?? 1;
    // const value = Number(numCarpentersInput.value);

    // if (totalHours && button) {
    //     // Recalculate the working days and update button text
    //     const workingDays = !customInputData ? await calculateWorkingDays(id, totalHours, value) : await calculateWorkingDays(id, totalHours, value, true);
    //     button.textContent = `Total: ${totalHours} hours / ${workingDays} days`;
    // }

    // Append the label and input field to the div
    numCarpentersDiv.appendChild(numCarpentersLabel);
    numCarpentersDiv.appendChild(numCarpentersInput);

    // Return the div & input field value
    return {
        'carpentersDiv': numCarpentersDiv,
        'inputField': numCarpentersInput,
        'inputValue': numCarpentersInput.value
    };
}

async function updateCarpenters(opportunity, input) {
    const {
        opportunity_id: id,
        totals: {grand_total: totalHours} = {},
        custom_input: { date_out: startDate } = {},
        custom_input: { planned_finish_date: plannedFinish } = {},
        custom_input: { include_weekends: includeWeekends} = {},
    } = opportunity;
    let value = Number(input.value);
    if (value < 1) value = 1;
    if (value > 20) value = 20;

    // Recalculate the working days
    const workingDays = await calculateWorkingDays(totalHours, value);

    const startBuildDate = plannedFinish ? createStartBuildDate(workingDays, plannedFinish, includeWeekends, true) : createStartBuildDate(workingDays, startDate, includeWeekends);

    try {
        const response = await fetch(`/workload/opportunities/${id}/custom_input/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                num_of_carpenters: value,
                working_days: workingDays,
                start_build_date: startBuildDate,
            })
        });

        if (!response.ok) {
            console.error(`Failed to update num_of_carpenters for opportunity ${id}`)
        }

        return response;
    } catch (err) {
        console.error('Error updating num_of_carpenters:', err);
    }
}

/**
 * Function to set the display to none when the user clicks the notification on the element
 */
function clickDisplayNone() {
    let clickElements = document.querySelectorAll('.click-display-none');
    clickElements.forEach(element => {
        element.addEventListener('click', function() {
            element.style.display = 'none';
        });
    });
}

/**
 * Function to set the div width dynamically based on the number of days
 */
function setDivWidth(startBuildDate, dateOut, div) {
    let startId = startBuildDate;
    let endId = dateOut;

    // Get the cells
    let cells = document.getElementsByClassName('cell-border');

    // Initialize the left and right points
    let left, right;

    // Iterate through the cells to find the start and end points
    for (let i = 0; i < cells.length; i++) {
        if (cells[i].id === startId) {
            left = cells[i].offsetLeft + 250;
        }
        if (cells[i].id === endId) {
            right = cells[i].offsetLeft + cells[i].offsetWidth;
        }
    }

    // Calculate the width of the div
    let width = right - left;
    // console.log('Width:', width);

    // Set the width and left of the div
    div.style.width = `${width + 250}px`;
    div.style.left = `${left - right}px`;
}

/**
 * Function to set the div style and background colour based on the opportunity status
 * @param {object} div - The div element
 * @param {number} status - The status of the opportunity
 * @param {number} workingDays - The number of working days
 * @param {string} startBuildDate - The start build date
 * @param {string} dateOut - The date out
 */
function setDivStyle(div, status, workingDays, startBuildDate, dateOut, divId=null) {
    div.classList.add(divId || div.id);
    div.classList.add('opportunity', 'mb-3', 'rounded-corners', 'div-border');
    setDivWidth(startBuildDate, dateOut, div);
    setRowClass(startBuildDate, dateOut, div);

    if (status === 1) {
        div.classList.add('provisional_background');
    } else if (status === 5) {
        div.classList.add('reserved_background');
    } else {
        div.classList.add('open-background');
    }

    if (workingDays > 0) {
        div.classList.add('pe-2', 'text-align-end');
    }
}

/**
 * Function to create a button to open the modal
 * @param {number} totalHours - The total number of hours
 * @param {number} workingDays - The number of working days
 * @returns {object} - The button element
 */
function createModalButton(totalHours, workingDays) {
    let button = document.createElement('button');
    button.type = 'button';
    button.classList.add('btn', 'btn-primary', 'mb-1', 'openModalButton');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#scenicCalcModal');
    button.textContent = `Total: ${totalHours} hours / ${workingDays} days`;

    return button;
}

/**
 * Function to create a badge for the modal button to display the total hours difference
 * @param {number} currentTotalHours - The current total number of hours
 * @param {number} previousTotalHours - The previous total number of hours
 * @param {number} totalHoursDifference - The total hours difference
 * @param {boolean} matchFound - The match found boolean
 * @returns {object} - The badge element
 */
function createModalBadge(matchFound=null, currentTotalHours=null, previousTotalHours=null, totalHoursDifference=0) {
    let badge = document.createElement('span');
    badge.classList.add('badge', 'click-display-none');
    if (matchFound === true && currentTotalHours !== null && previousTotalHours !== null) {
        if (currentTotalHours > previousTotalHours) {
            badge.classList.add('bg-danger');
            badge.textContent = `+${totalHoursDifference}`;
        } else if(currentTotalHours < previousTotalHours) {
            badge.classList.add('bg-success');
            badge.textContent = `${totalHoursDifference}`;
        } else {
            badge.style.display = 'none';
        }
    } else if (matchFound === false) {
        badge.classList.add('bg-warning');
        badge.textContent = `${currentTotalHours}`;
    } else {
        badge.classList.add('text-bg-secondary');
        badge.textContent = 'New alerts';
        badge.style.display = 'none';
    }

    return badge;
}

/**
 * Function to set the innerHTML of the opportunity div element
 * @param {number} workingDays - The number of working days
 * @param {string} currentOpportunityName - The current opportunity name
 * @param {boolean} matchFound - The match found boolean
 * @param {string} previousOpportunityName - The previous opportunity name
 * @param {string} currentStatusName - The current status name
 * @param {string} previousStatusName - The previous status name
 * @returns {string} - The innerHTML of the opportunity div
 */
function setInnerHTML(workingDays=0, currentOpportunityName=null, matchFound=null, previousOpportunityName=null, currentStatusName=null, previousStatusName=null) {
    let innerHTML;
    if (matchFound === true) {
        if (currentOpportunityName !== previousOpportunityName || currentStatusName !== previousStatusName) {
            innerHTML = `<span class="badge rounded-pill truncate ${workingDays > 0 ? 'text-align-end' : ''}">${currentOpportunityName}</span>
            <span class="position-absolute top-0 end-0 p-2 bg-info border border-light rounded-circle click-display-none">
                <span class="visually-hidden">New alerts</span>
            </span>`;
        } else {
            innerHTML = `<span class="badge rounded-pill truncate ${workingDays > 0 ? 'text-align-end' : ''}">${currentOpportunityName}</span>`;
        }
    } else if (matchFound === false) {
        innerHTML = `<span class="badge rounded-pill truncate ${workingDays > 0 ? 'text-align-end' : ''}">${currentOpportunityName}</span>
        <span class="position-absolute top-0 end-0 badge rounded-pill bg-warning click-display-none">
            <span>New</span>
        </span>`;
    } else {
        innerHTML = `<span class="badge rounded-pill truncate ${workingDays > 0 ? 'text-align-end' : ''}">${currentOpportunityName}</span>
        <span class="position-absolute top-0 end-0 p-2 bg-info border border-light rounded-circle click-display-none">
            <span class="visually-hidden">New alerts</span>
        </span>`;
    }

    return innerHTML;
}

/**
 * Generates the inner HTML content for a sibling opportunity element.
 * Displays the opportunity name (if provided), start build date, and date out.
 *
 * @param {string} startDate - The start date of the opportunity (YYYY-MM-DD format).
 * @param {string} dateOut - The date when the opportunity ends or transitions out (YYYY-MM-DD format).
 * @param {string|null} [currentOpportunityName=null] - The name of the opportunity (optional).
 *
 * @returns {string} - A formatted HTML string containing badges for display.
 */
function setSiblingInnerHTML(startDate, dateOut, currentOpportunityName=null) {
	const innerHTML = `<span class="badge rounded-pill truncate">${currentOpportunityName}</span>
        <span class="badge rounded-pill truncate d-block">Start Build Date: ${startDate}</span>
		<span class="badge rounded-pill truncate d-block">Date Out: ${dateOut}</span>`;

	return innerHTML;
}

/**
 * Function to create a checkbox input field for the opportunity
 * @param {number} id - The opportunity ID
 * @returns {object} - The checkbox div element and the include weekends input field
 */
async function createWeekendCheckbox(opportunity, customInputData=null) {
    const id = opportunity.opportunity_id
    const weekendDiv = document.createElement('div');
    weekendDiv.classList.add('weekends-checkbox', 'mb-1');

    const weekendLabel = document.createElement('label');
    weekendLabel.htmlFor = `weekends-${id}`;
    weekendLabel.classList.add('text-white', 'me-1');
    weekendLabel.textContent = 'Include Weekends';

    const weekendInput = document.createElement('input');
    weekendInput.type = 'checkbox';
    weekendInput.id = `weekends-${id}`;
    weekendInput.name = `weekends-${id}`;
    weekendInput.value = 'weekends';

    const savedState = customInputData ? customInputData.include_weekends : opportunity.custom_input?.include_weekends;
    
    weekendInput.checked = savedState === true;

    weekendDiv.appendChild(weekendLabel);
    weekendDiv.appendChild(weekendInput);

    return {
        'weekendDiv': weekendDiv,
        'includeWeekends': weekendInput
    };
}

async function updateWeekendsInput(opportunity, newState) {
    // const opportunityId = opportunity.opportunity_id;
    const {
        opportunity_id: opportunityId,
        custom_input: { date_out: startDate } = {},
        custom_input: { planned_finish_date : plannedFinish } = {},
        custom_input: { working_days: workingDays } = {},
    } = opportunity;
    console.log(plannedFinish);

    const startBuildDate = plannedFinish ? createStartBuildDate(workingDays, plannedFinish, newState, true) : createStartBuildDate(workingDays, startDate, newState);

    try {
        const response = await fetch(`/workload/opportunities/${opportunityId}/custom_input/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'appilcation/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                include_weekends: newState,
                start_build_date: startBuildDate,
            }),
        });

        if (!response.ok) {
            console.error(`Failed to update include_weekends for opportunity ${opportunityId}`);
        }

        return response;
    } catch (err) {
        console.error('Error updating include_weekends:', err);
    }
}

/**
 * Function to create a start build date for the opportunity
 * @param {number} workingsDays - The number of working days
 * @param {string} dateOut - The date out of the opportunity
 * @param {boolean} includeWeekends - The include weekends boolean
 * @returns {object} - The start build date
 */
function createStartBuildDate(workingDays, dateOut, includeWeekends, plannedFinish = false) {
    if (isNaN(Date.parse(dateOut))) {
        console.error('Invalid input to createStartBuildDate: dateOut must be a valid date');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the createStartBuildDate function: dateOut must be a valid date';
        errorMsgDiv.appendChild(errorMsg);
        return '';
    }

    if (typeof workingDays !== 'number') {
        console.error('Invalid input to createStartBuildDate: workingDays must be a number');
        const errorMsgDiv = document.querySelector('#api-error-msg');
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'An error occurred while running the createStartBuildDate function: workingDays must be a number';
        errorMsgDiv.appendChild(errorMsg);
        return '';
    }

    let startBuildDate = new Date(dateOut);
    workingDays = plannedFinish ? Math.ceil(workingDays) - 1 : Math.ceil(workingDays);  //round up to the nearest whole number

    if (!includeWeekends) {
        while (workingDays > 0) {
            startBuildDate.setDate(startBuildDate.getDate() - 1);
            // If it is not a weekend
            if (startBuildDate.getDay() !== 0 && startBuildDate.getDay() !== 6) {
                workingDays--;
            }
        }
    } else {
        startBuildDate.setDate(startBuildDate.getDate() - workingDays);
    }

    startBuildDate = startBuildDate.toISOString().split('T')[0];

    return startBuildDate;
}

/**
 * Function to remove divs from the calendar
 * @param {number} id - The opportunity ID
 */
function removeOldDivs(className) {
    const oldDivs = document.getElementsByClassName(className);

    // Convert to an array before removing elements
    Array.from(oldDivs).forEach(div => div.remove());
}

/**
 * Function to set the row class for the opportunity div element
 */
function setRowClass(startBuildDate, dateOut, div) {
    let startId = startBuildDate;
    let endId = dateOut;
    // console.log(`Working on div ${div.id}`);

    // Get the cells
    let cells = document.getElementsByClassName('cell-border');

    // Create the row array
    let rowArray = [
        'row-one', 'row-two', 'row-three', 'row-four', 'row-five', 'row-six', 'row-seven', 'row-eight', 'row-nine', 'row-ten',
        'row-eleven', 'row-twelve', 'row-thirteen', 'row-fourteen', 'row-fifteen', 'row-sixteen', 'row-seventeen', 'row-eighteen', 'row-nineteen', 'row-twenty',
        'row-twenty-one', 'row-twenty-two', 'row-twenty-three', 'row-twenty-four'
    ];

    // Track the assigned classes
    let assignedClasses = new Set();

    for (let i = 0; i < cells.length; i++) {
        if (cells[i].id >= startId && cells[i].id <= endId) {
            let divs = cells[i].querySelectorAll('.opportunity');
            // console.log(`Cell ${cells[i].id} contains ${divs.length} divs`);
            // for (let j = 0; j < divs.length; j++) {
            //     console.log(`Div ${divs[j].id} is in cell ${cells[i].id}`);
            // }

            // Collect already assigned classes
            divs.forEach(existingDiv => {
                if (existingDiv.id !== div.id) {
                    rowArray.forEach(rowClass => {
                        if (existingDiv.classList.contains(rowClass)) {
                            assignedClasses.add(rowClass);
                        }
                    });
                }
            });

            // Remove existing row classes from the div
            rowArray.forEach(rowClass => {
                if (div.classList.contains(rowClass)) {
                    div.classList.remove(rowClass);
                    // console.log(`Removed class ${rowClass} from div ${div.id}`);
                }
            });

            // Assign a new row class to the div
            for (let k = 0; k < rowArray.length; k++) {
                if (!assignedClasses.has(rowArray[k])) {
                    div.classList.add(rowArray[k]);
                    // console.log(`Assigned class ${rowArray[k]} to div ${div.id}`);
                    break;
                }
            }
        }
    }
}

/**
 * Function to set the table row heights dynamically
 */
function adjustTableRowHeights() {
    let rows = document.querySelectorAll('tr');

    let maxHeight = 0;
    const rowHeightArr = [];

    rows.forEach(row => {  

        row.querySelectorAll('td').forEach(cell => {
            let divs = cell.querySelectorAll('.opportunity');
            divs.forEach(div => {
                let topValue = parseInt(window.getComputedStyle(div).top, 10);
                let divHeight = div.offsetHeight;
                let totalHeight = topValue + divHeight;
                if (totalHeight > maxHeight) {
                    maxHeight = totalHeight;
                }
            })
        })

        rowHeightArr.push(maxHeight);
    })

    maxHeight = Math.max(...rowHeightArr);
    rows.forEach(row => {
        row.style.height = `${maxHeight + 6}px`;
    })
}

/**
 * Function to check if an opportunity spans across more than a single month
 * @param {date} startDate - The start build date for the opportunity
 * @param {date} endDate - The date out for the opportunity
 * @returns {object} - An object containing `spansMultipleMonths` (boolean) and `monthDiff` (number)
 */
function checkOpportunityDuration(startDate, endDate) {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
        throw new Error("Invalid input: startDate and endDate must be Date objects");
    }

    let startMonth = startDate.getMonth();
    let endMonth = endDate.getMonth();
    let startYear = startDate.getFullYear();
    let endYear = endDate.getFullYear();
    
    let monthDiff = (endYear - startYear) * 12 + (endMonth - startMonth);

    return {
        spansMultipleMonths: monthDiff > 0,
        monthDiff,
    };
}

/**
 * Function to get the last day of the month
 * @param {string} dateString - A date string in the format "yyyy-mm-dd"
 * @returns {string} The last day of the month for the given date in "yyyy-mm-dd" format
 */
function getLastDayOfMonth(dateString) {
    const [year, month] = dateString.split('-').map(Number);
    
    // Create a date for the first day of the next month, then subtract one day
    const nextMonth = new Date(year, month, 1); // month is 0-based
    const lastDay = new Date(nextMonth.getTime() - 1);
    
    // Format the date to "yyyy-mm-dd"
    const lastDayString = lastDay.toISOString().split('T')[0]; 
    
    return lastDayString;
}

/**
 * Finds the earliest visible date within the same row as the given date.
 * Searches for the first `<td>` element that is not hidden (i.e., does not have the "display-none" class).
 *
 * @param {string} dateString - The ID of the target `<td>` element, which represents a date (formatted as "YYYY-MM-DD").
 *
 * @returns {string|null} - The ID of the earliest visible `<td>` element in the same row, or `null` if none are found.
 */
function getEarliestVisibleDate(dateString) {
    const targetTd = document.getElementById(dateString);
    if (!targetTd) {
        console.error("Could not find the target <td> element:", targetTd);
        return null;
    }

    const row = targetTd.closest("tr");
    if (!row) {
        console.error("Could not find the parent row");
        return null;
    }

    const cells = row.getElementsByClassName("cell-border");

    for (let cell of cells) {
        if (!cell.classList.contains("display-none")) {
            return cell.id;
        }
    }

    console.warn("No visible <td> elements found");
    return null;
}

/**
 * Checks if a given date (represented by a '<td>' element ID) is visible in the DOM.
 * If the date is not visible, finds the earliest visible date in the same row.
 *
 * @param {string} dateString - The ID of the target '<td>' element, representing a date (formatted as "YYYY-MM-DD").
 * @param {string} dateStringTwo - The fallback ID of the target '<td>', representing a date (formatted as "YYYY-MM-DD").
 *
 * @returns {string|null} - The ID of the visible '<td>' element, either the original or the earliest visible one, or 'null' if none are visible.
 */
function isDateVisible(dateString, dateStringTwo) {
    const startCell = document.getElementById(dateString);

    // Check if startCell exists and is visible
    if (startCell && !startCell.classList.contains("display-none")) {
        return dateString;
    } 

    // Otherwise, find the earliest visible date
    return getEarliestVisibleDate(dateStringTwo);
}

/**
 * Sorts an array of opportunity objects by their start date in ascending order.
 *
 * @param {Array} opportunities - An array of opportunity objects. Each object must contain a `startDate` property as a string in the format 'YYYY-MM-DD'.
 * @returns {Array} A new array of opportunities sorted from the earliest to the latest start date.
 */
function sortOpportunitiesByStartDate(opportunities) {
    for (let i = 0; i < opportunities.length; i++) {
        const opportunity = opportunities[i];
        const tempDateOut = opportunity.custom_input["planned_finish_date"] ? opportunity.custom_input["planned_finish_date"] : opportunity.custom_input["date_out"];
        opportunity.custom_input["temp_date_out"] = tempDateOut;
    }

    return opportunities.slice().sort((a, b) => new Date(a.custom_input["temp_date_out"]) - new Date(b.custom_input["temp_date_out"]));
}

/**
 * Calculates the distribution of carpenters across working days within a given date range.
 *
 * Iterates over table cells with date-based IDs and collects those that fall between 
 * the start and end dates. Optionally excludes weekends from the list of working days.
 * Returns an array of objects with each date and the associated carpenters data.
 *
 * @param {string|Date} startBuildDate - The start date of the build period.
 * @param {string|Date} dateOut - The end date (exclusive) for the build period.
 * @param {Object} carpenters - The carpenter data to associate with each working day.
 * @param {boolean} [includeWeekends=false] - Whether to include weekends as working days.
 * @returns {Array<Object>} An array of objects, each containing a date and the carpenters data.
 */
function calculateDailyCarpenters(startBuildDate, dateOut, carpenters, includeWeekends = false, pfd = false) {
    const startDate = new Date(startBuildDate);
    const endDate = new Date(dateOut);
    const cells = document.getElementsByClassName('cell-border');
    const workingDays = [];

    for (const cell of cells) {
        const cellDate = new Date(cell.id);
        if (pfd) {
            if (cellDate >= startDate && cellDate <= endDate) {
                const cellDateStr = cell.id
                const day = cellDate.getDay();
                const isWeekend = day === 0 || day === 6;

                if (!includeWeekends && isWeekend) {
                        continue;
                } 
                
                workingDays.push(cellDateStr);
            }
        } else {
            if (cellDate >= startDate && cellDate < endDate) {
                const cellDateStr = cell.id
                const day = cellDate.getDay();
                const isWeekend = day === 0 || day === 6;
    
                if (!includeWeekends && isWeekend) {
                        continue;
                } 
                
                workingDays.push(cellDateStr);
            }
        }
    }

    const carpentersPerDay = workingDays.map(date => ({
        date,
        carpenters
    }));

    return carpentersPerDay;
}

/**
 * Adds the specified number of carpenters to each corresponding day's cell in the UI.
 *
 * Iterates through table cells and matches them with the provided list of carpenter data 
 * by date. If a match is found, the function updates the displayed number of daily 
 * carpenters by incrementing the existing value.
 *
 * @param {Array<Object>} carpentersPerDay - An array of objects, each containing:
 *   - {string} date: The date corresponding to a table cell (cell ID).
 *   - {Object} carpenters: An object with at least an 'inputValue' property representing the number of carpenters to add.
 */
function addDailyCarpenters(carpentersPerDay) {
    const cells = document.getElementsByClassName('cell-border');
    
    if (carpentersPerDay.length === 0 ) return;

    for (const cell of cells) {
        for (const carpPerDay of carpentersPerDay) {
            if (cell.id === carpPerDay['date']) {
                const carpObj = carpPerDay['carpenters'];
                const carpNum = parseInt(carpObj['inputValue']);

                const carpElem = document.getElementById(`dailyCarp-${cell.id}`);
                if (!carpElem) continue;

                const carpElemNum = parseInt(carpElem.innerText) || 0;
                carpElem.innerText = carpElemNum + carpNum;
            }
        }
        
    }
}

/**
 * Subtracts the specified number of carpenters from each corresponding day's cell in the UI.
 *
 * Iterates through table cells and matches them with the provided list of carpenter data 
 * by date. If a match is found, the function updates the displayed number of daily 
 * carpenters by decrementing the existing value.
 *
 * @param {Array<Object>} carpentersPerDay - An array of objects, each containing:
 *   - {string} date: The date corresponding to a table cell (cell ID).
 *   - {Object} carpenters: An object with at least an 'inputValue' property representing the number of carpenters to remove.
 */
function removeDailyCarpenters(carpentersPerDay) {
    const cells = document.getElementsByClassName('cell-border');
    
    if (carpentersPerDay.length === 0 ) return;

    for (const cell of cells) {
        for (const carpPerDay of carpentersPerDay) {
            if (cell.id === carpPerDay['date']) {
                const carpObj = carpPerDay['carpenters'];
                const carpNum = parseInt(carpObj['inputValue']);

                const carpElem = document.getElementById(`dailyCarp-${cell.id}`);
                if (!carpElem) continue;

                const carpElemNum = parseInt(carpElem.innerText) || 0;
                carpElem.innerText = carpElemNum - carpNum;
            }
        }
        
    }
}

function getCSRFToken() {
    let cookieValue = null;
    const name = "csrftoken";
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function getDateRange(startDate, endDate) {
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

function renderOpportunityAcrossCells(opportunityDiv, startBuildDate, dateOut, rowClass) {
    const dateRange = getDateRange(startBuildDate, dateOut);

    dateRange.forEach((date, index) => {
        const cell = document.getElementById(date);
        if (!cell) return;

        const segment = opportunityDiv.cloneNode(true);
        segment.classList.add(rowClass, 'opportunity-segment');

        // Style the ends
        if (index === 0) {
            segment.classList.add('rounded-start');
        } else if (index === dateRange.length - 1) {
            segment.classList.add('rounded-end');
        } else {
            segment.classList.add('flat-middle');
        }

        cell.appendChild(segment);
    })
}

function createPreviousOpportunityObjects(opportunityObjects) {
    const previousOpportunities = [];

    for (let i = 0; i < opportunityObjects.length; i++) {
        const opportunity = opportunityObjects[i];
        const oppItems = opportunity.items;
        const items = [];
        for (let j = 0; j < oppItems.length; j++) {
            const item = {
                "current_item_id": oppItems[j].current_item_id,
                "name": oppItems[j].name,
                "item_total": oppItems[j].previous_item_total,
                "updated_at": oppItems[j].item_previously_updated_at,
            };

            items.push(item);
        }

        const previousOpportunity = {
            "opportunity_id": opportunity.opportunity_id,
            "name": opportunity.previous_name,
            "client": opportunity.client,
            "status_name": opportunity.previous_status_name,
            "custom_input": {
                "date_out": opportunity.custom_input["previous_date_out"],
                "time_out": opportunity.custom_input["previous_time_out"],
                "working_days": opportunity.custom_input["previous_working_days"],
                "include_weekends": opportunity.custom_input["previous_include_weekends"],
                "planned_finish_date": opportunity.custom_input["previous_planned_finish_date"],
                "num_of_carpenters": opportunity.custom_input["previous_num_of_carpenters"],
                "updated_at": opportunity.custom_input["previously_updated_at"],
            },
            "items": items,
            "totals": {
                "grand_total": opportunity.totals["previous_grand_total"],
            }
        };

        previousOpportunities.push(previousOpportunity);
    }

    return previousOpportunities;
}

function showMessageModal(message) {
    const modalEl = document.getElementById('messageModal');
    const modalText = document.getElementById('messageText');
    modalText.textContent = message;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
};

function getOppIds(oppData) {
    const oppIds = [];
    for (let i = 0; i < oppData.length; i++) {
        const oppId = oppData[i].opportunity_id;
        oppIds.push(oppId);
    }

    console.log(oppIds);
    return oppIds;
}