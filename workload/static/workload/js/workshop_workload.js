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
    fetch(`/workload/api/workload/?days=${days}`)
        .then(response => response.json())
        .then (data => {
            console.log(data);
            const total = parseFloat(data.provisional_weight) + parseFloat(data.reserved_weight) + parseFloat(data.confirmed_weight);
            console.log(total);
            displayOpportunities(data.confirmed_opportunities);
        })
        .catch(error => {
            console.error('Error:', error);
            const errorMsgDiv = document.querySelector('api-error-msg');
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
    for (let i = 0; i < data.length; i++) {
        //Create an array to store scenic opportunities
        
        let opportunity = data[i];
        

        //Check if the opportunity has a scenic tag
        if (opportunity.tag_list.includes('SCENIC')) {
            //Add the opportunity to the scenic opportunities array
            scenicOpportunities.push(opportunity);
        }   
    }
    // Create opportunity elements
    for (let j = 0; j < scenicOpportunities.length; j++) {
        let opportunityEvent = scenicOpportunities[j];
        let status = opportunityEvent.status;
        let opportunityType;
        let opportunityName = opportunityEvent.subject;
        let startDate;
        let startTime;
        let loadStartsAt;
        let id = opportunityEvent.id;
        let client = opportunityEvent.member['name'];

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

        // Set the opportunity type
        if (opportunityEvent.custom_fields['dry_hire'] === 'Yes') {
            opportunityType = 'Dry Hire';
        } else if (opportunityEvent.custom_fields['dry_hire_transport'] === 'Yes') {
            opportunityType = 'Dry Hire Transport';
        } else {
            opportunityType = 'Wet Hire';
        }

        if (status !== 20) {
            let opportunityDiv = document.createElement('div');
            opportunityDiv.classList.add('opportunity', 'col-12', 'col-sm-4', 'col-md-3', 'mb-3');
            opportunityDiv.setAttribute('data-hire-type', opportunityType);
            opportunityDiv.innerHTML = `
                    <div class="card">
                        <div class="card-body text-bg-success">
                            <h5 class="card-title">${opportunityName}</h5>
                            <p class="card-text">Client: ${client}</p>
                            <p class="card-text">Date Out: ${startDate}, ${startTime}</p>
                            <a href="https://lfps.current-rms.com/opportunities/${id}" target="_blank" class="btn btn-primary">Open in Current</a>
                        </div>
                    </div>
                `
            scenicDiv.appendChild(opportunityDiv);
        }
    }
    console.log(`Scenic Opportunities: `, scenicOpportunities);
}