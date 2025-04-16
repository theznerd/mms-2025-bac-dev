// BAC Tracker client-side functionality

// Function to format BAC with proper coloring based on level
function formatBACDisplay(bac) {
    const bacValue = parseFloat(bac);
    const bacElement = document.getElementById('bacValue');
    
    if (!bacElement) return;
    
    // Remove existing color classes
    bacElement.classList.remove('text-success', 'text-warning', 'text-danger');
    
    // Add appropriate color class based on BAC level
    if (bacValue >= 0.08) {
        bacElement.classList.add('text-danger');
    } else if (bacValue >= 0.04) {
        bacElement.classList.add('text-warning');
    } else {
        bacElement.classList.add('text-success');
    }
}

// Animation for BAC value changes
function animateBACUpdate() {
    const bacElement = document.getElementById('bacValue');
    if (!bacElement) return;
    
    bacElement.classList.add('animate__pulse');
    setTimeout(() => {
        bacElement.classList.remove('animate__pulse');
    }, 1000);
}

// Initialize datetime-local inputs with current time
function initDateTimeInputs() {
    const consumedTimeInput = document.getElementById('NewBeverage_ConsumedTime');
    if (!consumedTimeInput) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    consumedTimeInput.value = formattedDateTime;
}

// Initialize functionality when document is ready
document.addEventListener('DOMContentLoaded', function () {
    initDateTimeInputs();
    
    // Apply initial BAC formatting
    const bacValueElement = document.getElementById('bacValue');
    if (bacValueElement) {
        const bacText = bacValueElement.textContent;
        const bacValue = parseFloat(bacText);
        formatBACDisplay(bacValue);
    }
});