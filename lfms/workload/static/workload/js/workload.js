// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    fetchData();
    setInterval(fetchData, 2 * 60 * 60 * 1000) // Fetch data every 2 hours
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
        green.classList.add('green', 'fade-in');
        if (red.classList.contains('red')) {
            red.classList.remove('red', 'fade-in');
            red.classList.add('fade-out');
        } else if (yellow.classList.contains('yellow')) {
            yellow.classList.remove('yellow', 'fade-in');
            yellow.classList.add('fade-out');
        }
    }
}