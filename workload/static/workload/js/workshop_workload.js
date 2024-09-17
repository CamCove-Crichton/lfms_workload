// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    fetchData(91);
    setInterval( () => {
        fetchData(91);
    }, 2 * 60 * 60 * 1000);
});


/**
 * Function to fetch the data from the API from the backend
 * @returns {Promise} - The data from the API
 */
function fetchData(days) {
    let overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'flex';
    void overlay.offsetWidth;
    overlay.classList.add('show');
    fetch(`/workload/api/workshop_workload/?days=${days}`)
        .then(response => response.json())
        .then (data => {
            displayOpportunities(data);
            overlay.classList.remove('show');
            setTimeout(() => overlay.style.display = 'none', 500);
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
 */
function displayOpportunities(data) {
    let scenicOpportunities = [];
    let scenicDiv = document.getElementById('scenic-opps');
    let activeProducts = data.active_products;
    let opportunities = data.opportunities_with_items;

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
    
    // Create opportunity elements
    for (let j = 0; j < scenicOpportunities.length; j++) {
        let opportunityEvent = scenicOpportunities[j];
        let status = opportunityEvent.opportunity['status'];
        let statusName = opportunityEvent.opportunity['status_name'];
        let opportunityType;
        let opportunityName = opportunityEvent.opportunity['subject'];
        let startDate;
        let startTime;
        let loadStartsAt;
        let id = opportunityEvent.opportunity['id'];
        let client = opportunityEvent.opportunity['member']['name'];
        let itemNameArray = [];
        let opportunityItems = opportunityEvent.items;

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

        // Get the total number of hours from the scenic calc array
        let totalHours = 0;
        for (let p = 0; p < scenicCalcArray.length; p++) {
            totalHours += scenicCalcArray[p].quantity;
            // scenicCalcArray[p].quantity = totalHours;
        }

        // Create a div to display the Scenic Calc items
        let scenicCalcDiv = document.createElement('div');
        scenicCalcDiv.classList.add('card-text');
        for (let o = 0; o < scenicCalcArray.length; o++) {
            let scenicCalcName = scenicCalcArray[o].name;
            let scenicCalcQuantity = scenicCalcArray[o].quantity;
            let scenicCalcP = document.createElement('p');
            scenicCalcP.innerHTML = `<span class="bold-text">${scenicCalcName}:</span> ${scenicCalcQuantity} hours`;
            scenicCalcDiv.appendChild(scenicCalcP);
        }

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

        // Set the opportunity type
        if (opportunityEvent.opportunity['custom_fields']['dry_hire'] === 'Yes') {
            opportunityType = 'Dry Hire';
        } else if (opportunityEvent.opportunity['custom_fields']['dry_hire_transport'] === 'Yes') {
            opportunityType = 'Dry Hire Transport';
        } else {
            opportunityType = 'Wet Hire';
        }

        // Create html elements for the opportunities
        // Opportunity div
        let opportunityDiv = document.createElement('div');
        opportunityDiv.classList.add('opportunity', 'col-12', 'col-sm-4', 'col-md-3', 'mb-3');
        opportunityDiv.setAttribute('data-hire-type', opportunityType);
        
        // Card div
        let cardDiv = document.createElement('div');
        cardDiv.className = 'card';

        // Card body div
        let cardBodyDiv = document.createElement('div');
        cardBodyDiv.className = 'card-body';
        cardBodyDiv.classList.add('height-600');

        // Title
        let title = document.createElement('h5');
        title.className = 'card-title';
        title.classList.add('bold-text');
        title.textContent = opportunityName;

        // Client
        let clientP = document.createElement('p');
        clientP.className = 'card-text';
        clientP.innerHTML = `<span class="bold-text">Client:</span> ${client}`;

        // Date Out
        let dateOutP = document.createElement('p');
        dateOutP.className = 'card-text';
        dateOutP.innerHTML = `<span class="bold-text">Date Out:</span> ${startDate}, ${startTime}`;

        // Status
        let statusP = document.createElement('p');
        statusP.className = 'card-text';
        statusP.innerHTML = `<span class="bold-text">Status:</span> ${statusName}`;
        
        // Open in Current button
        let anchor = document.createElement('a');
        anchor.href = 'https://lfps.current-rms.com/opportunities/' + id;
        anchor.target = '_blank';
        anchor.className = 'btn btn-primary';
        anchor.textContent = 'Open in Current';

        // Total hours
        let totalHoursP = document.createElement('p');
        totalHoursP.className = 'card-text';
        totalHoursP.innerHTML = `<span class="bold-text">Total:</span> ${totalHours} hours`;

        // Check the status of the opportunity and display the appropriate background colour
        if (status !== 20) {
            if (status === 1) {
                cardBodyDiv.classList.add('provisional_background');
            } else if (status === 5) {
                cardBodyDiv.classList.add('reserved_background');
            } else {
                cardBodyDiv.classList.add('text-bg-success');
            }

            // Append the elements to the card body div
            cardBodyDiv.appendChild(title);
            cardBodyDiv.appendChild(clientP);
            cardBodyDiv.appendChild(dateOutP);
            cardBodyDiv.appendChild(statusP);
            cardBodyDiv.appendChild(scenicCalcDiv);
            cardBodyDiv.appendChild(totalHoursP);
            cardBodyDiv.appendChild(anchor);

            // Append the card body div to the card div
            cardDiv.appendChild(cardBodyDiv);

            // Append the card div to the opportunity div
            opportunityDiv.appendChild(cardDiv);

            // Append the opportunity div to the scenic div
            scenicDiv.appendChild(opportunityDiv);
        }
    }
}