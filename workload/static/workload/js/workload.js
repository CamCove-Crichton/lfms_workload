// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    rollingCalendar();
    fetchData();
    getQuotes();
    setInterval( () => {
        rollingCalendar();
        fetchData();
        getQuotes();
    }, 2 * 60 * 60 * 1000);
});


/**
 * Function to fetch the data from the API from the backend
 * @returns {Promise} - The data from the API
 */
function fetchData() {
    fetch('/workload/api/workload/')
        .then(response => response.json())
        .then (data => {
            console.log(data);
            const total = parseFloat(data.provisional_weight) + parseFloat(data.reserved_weight) + parseFloat(data.confirmed_weight);
            console.log(total);
            setTrafficLightColour(total);
            assignWeightValues(data.provisional_weight, data.reserved_weight, data.confirmed_weight);
            displayOpportunities(data.confirmed_opportunities);
            displayOpportunities(data.active_opportunities);
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
 * Function to check what the total weight is and set the traffic light colour accordingly
 * @param {number} weight - The total weight of the workload over a 14 day period
 */
function setTrafficLightColour(weight) {
    let red = document.getElementById('red');
    let yellow = document.getElementById('yellow');
    let green = document.getElementById('green');

    red.classList.add('red', 'fade-out');
    yellow.classList.add('yellow', 'fade-out');
    green.classList.add('green', 'fade-out');

    if (weight > 40000) {
        red.classList.remove('fade-out');
        red.classList.add('red', 'fade-in');
        if (yellow.classList.contains('fade-in')) {
            yellow.classList.remove('yellow', 'fade-in');
            yellow.classList.add('fade-out');
        } else if (green.classList.contains('fade-in')) {
            green.classList.remove('green', 'fade-in');
            green.classList.add('fade-out');
        }
    } else if (weight > 30000) {
        yellow.classList.remove('fade-out');
        yellow.classList.add('yellow', 'fade-in');
        if (red.classList.contains('fade-in')) {
            red.classList.remove('fade-in');
            red.classList.add('fade-out');
        } else if (green.classList.contains('fade-in')) {
            green.classList.remove('fade-in');
            green.classList.add('fade-out');
        }
    } else {
        green.classList.remove('fade-out');
        green.classList.add('green', 'fade-in');
        if (red.classList.contains('fade-in')) {
            red.classList.remove('fade-in');
            red.classList.add('fade-out');
        } else if (yellow.classList.contains('fade-in')) {
            yellow.classList.remove('fade-in');
            yellow.classList.add('fade-out');
        }
    }
}


/**
 * Function to set assign the weight values to html elements
 */
function assignWeightValues(weightOne, weightTwo, weightThree) {
    let provisional = document.getElementById('provisional_weight');
    let reserved = document.getElementById('reserved_weight');
    let confirmed = document.getElementById('confirmed_weight');

    provisional.innerHTML = weightOne;
    reserved.innerHTML = weightTwo;
    confirmed.innerHTML = weightThree;
}


/**
 * Function to fetch a random quote from the quotable API
 */
function getQuotes() {
    const requestOptions = {
        method: "GET",
        redirect: "follow"
      };
      
      fetch("https://api.quotable.io/quotes/random?tags=wisdom|famous-quotes", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
            const quoteDiv = document.getElementById('quote');
            const authorDiv = document.getElementById('author');
            quoteDiv.textContent = result[0].content;
            authorDiv.textContent = result[0].author;
        })
        .catch((error) => console.error(error));
}


/** 
 * Function to handle the rolling Calendar days
 */
function rollingCalendar() {
    let today = new Date();
    let rollingDates = Array.from({length: 28}, (_, i) => {
        let date = new Date(today.getTime());
        date.setDate(today.getDate() + i);
        return date;
    });

    let cells = document.getElementsByClassName('cell-border');
    for (let i = 0; i < cells.length; i++) {
        cells[i].id = rollingDates[i].toISOString().split('T')[0];

        let day = rollingDates[i].getDate();
        let month = rollingDates[i].toLocaleString('default', { month: 'short' });
        let weekday = rollingDates[i].toLocaleString('default', { weekday: 'short' });
        cells[i].innerHTML = `<p class="mb-1">${weekday} ${day} ${month}</p>`;
    }

    console.log(rollingDates);
}


/**
 * Function to display the opportunities in the calendar
 */
function displayOpportunities(data) {
    for (let i = 0; i < data.length; i++) {
        let opportunity = data[i];
        let startDate;
        let startTime;
        let loadStartsAt;
        let endDate;
        let endTime;
        let unloadStartsAt;
        let opportunityType;
        let opportunityName = opportunity.subject;
        // let clientName = opportunity.member['name'];
        // let projectManager = opportunity.owner['name'];
        // let orderNumber = opportunity.number;
        let status = opportunity.status;

        // Set the start date and time
        if (opportunity.load_starts_at !== null) {
            startDate = opportunity.load_starts_at.split('T')[0];
            loadStartsAt = new Date(opportunity.load_starts_at);
            startTime = loadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } else if (opportunity.deliver_starts_at !== null) {
            startDate = opportunity.deliver_starts_at.split('T')[0];
            loadStartsAt = new Date(opportunity.deliver_starts_at);
            startTime = loadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } else {
            startDate = opportunity.starts_at.split('T')[0];
            loadStartsAt = new Date(opportunity.starts_at);
            startTime = loadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }

        // Set the end date and time
        if (opportunity.unload_starts_at !== null) {
            endDate = opportunity.unload_starts_at.split('T')[0];
            unloadStartsAt = new Date(opportunity.unload_starts_at);
            endTime = unloadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } else if (opportunity.collect_starts_at !== null) {
            endDate = opportunity.collect_starts_at.split('T')[0];
            unloadStartsAt = new Date(opportunity.collect_starts_at);
            endTime = unloadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } else {
            endDate = opportunity.ends_at.split('T')[0];
            unloadStartsAt = new Date(opportunity.ends_at);
            endTime = unloadStartsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }

        // Set the opportunity type
        if (opportunity.custom_fields['dry_hire'] === 'Yes') {
            opportunityType = 'Dry Hire';
        } else if (opportunity.custom_fields['dry_hire_transport'] === 'Yes') {
            opportunityType = 'Dry Hire Transport';
        } else {
            opportunityType = 'Wet Hire';
        }

        // Get the cell to display the opportunity
        let cells = document.getElementsByClassName('cell-border');
        for (let j = 0; j < cells.length; j++) {
            // Check the start date of the opportunity
            if (cells[j].id == startDate) {
                if (status !== 20) {
                    let opportunityDiv = document.createElement('div');
                    opportunityDiv.classList.add('opportunity');
                    opportunityDiv.style.width = '100%';
                    opportunityDiv.setAttribute('data-hire-type', opportunityType);
                    opportunityDiv.innerHTML = `
                        <span class="badge rounded-pill text-bg-success truncate">${opportunityName}</span>`
                    cells[j].appendChild(opportunityDiv);
                }

                // Check the end date of the opportunity
            } else if (cells[j].id == endDate) {
                let opportunityDiv = document.createElement('div');
                opportunityDiv.classList.add('opportunity');
                opportunityDiv.style.width = '100%';
                opportunityDiv.setAttribute('data-hire-type', opportunityType);
                opportunityDiv.innerHTML = `
                    <span class="badge rounded-pill text-bg-danger truncate">${opportunityName}</span>`
                cells[j].appendChild(opportunityDiv);
            }
        }
    }
}