// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    getTotalWeight();
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
    
}