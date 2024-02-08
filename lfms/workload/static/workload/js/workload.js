// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    getTotalWeight();
    setTrafficLightColour(getTotalWeight());
});

/**
 * Function to tally the total weight of the workload
 */
function getTotalWeight() {
    // Get the provisional weight
    const provisional_str = document.getElementById('provisional_weight').innerHTML;
    const provisional = parseFloat(provisional_str);

    // Get the reserved weight
    const reserved_str = document.getElementById('reserved_weight').innerHTML;
    const reserved = parseFloat(reserved_str);
    
    // Get the confirmed weight
    const confirmed_str = document.getElementById('confirmed_weight').innerHTML;
    const confirmed = parseFloat(confirmed_str);
    
    // Calculate the total weight
    const total = provisional + reserved + confirmed;
    return total;
}

function setTrafficLightColour(weight) {
    let red = document.getElementById('red');
    let yellow = document.getElementById('yellow');
    let green = document.getElementById('green');

    red.classList.add('red', 'fade-out');
    yellow.classList.add('yellow', 'fade-out');
    green.classList.add('green', 'fade-out');

    if (weight > 40000) {
        console.log('Weight greater than 40000');
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
        console.log('Weight greater than 30000');
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
        console.log('Weight less than 30000');
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