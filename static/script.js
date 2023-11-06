document.addEventListener('DOMContentLoaded', () => {
    // Grabbing all the necessary DOM elements
    const participateButton = document.getElementById('participate-button');
    const mainHeader = document.getElementById('main-header');
    const interactionCounter = document.getElementById('interaction-counter');
    const avatarContainer = document.getElementById('avatar-container');
    const aiResponse = document.getElementById('ai-response');
    const userInteractionArea = document.getElementById('user-interaction-area');
    const userInput = document.getElementById('user-input');
    const submitButton = document.getElementById('submit-answer');
    const questionnaire = document.getElementById('questionnaire');
    let interactionCount = 15; // Initialize interaction count

    // Listen for click on the participate button to start the interaction
    participateButton.addEventListener('click', startInteraction);

    // Listen for click on the submit button to send input to the AI
    submitButton.addEventListener('click', () => {
        if (userInput.value.trim()) {
            sendUserInputToAI(userInput.value);
            userInput.value = ''; // Clear the input after sending
        } else {
            alert('Please enter your answer.'); // Alert if input is empty
        }
    });


// Function to handle the start of interaction
function startInteraction() {
    // Hide the welcome header and show interaction elements
    mainHeader.classList.add('hidden');
    interactionCounter.classList.remove('hidden');
    avatarContainer.classList.remove('hidden');
    aiResponse.classList.remove('hidden');
    userInteractionArea.classList.remove('hidden');
    fetchRandomAvatar();
    fetchRandomAssignment();
}
// Function to fetch a random avatar from the server
function fetchRandomAvatar() {
    // Send a GET request to the server to get a random avatar
    fetch('/api/random-avatar')
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                // If no error, display the avatar
                avatarContainer.innerHTML = `<img src="/static/images/${data.avatar}" alt="Avatar">`;
            } else {
                console.error('Error fetching avatar:', data.error);
            }
        })
        .catch(error => console.error('Error fetching avatar:', error));
}

// Function to fetch a random assignment from the server
function fetchRandomAssignment() {
    // Send a GET request to the server to get a random assignment
    fetch('/api/get-assignment')
        .then(response => response.json())
        .then(data => {
            // Display the assignment in the AI response area
            aiResponse.textContent = data.assignment;
        })
        .catch(error => console.error('Error fetching assignment:', error));
}

// Function to send the user's input to the AI and get a response
function sendUserInputToAI(input) {
    // Display a loading message or similar feedback in the AI response area
    aiResponse.textContent = 'Thinking...';

    // Send a POST request to the server with the user's input
    fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_input: input })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.error) {
            // If no error, display the AI's response
            aiResponse.textContent = data.message;
            updateInteractionCount();
        } else {
            aiResponse.textContent = 'An error occurred. Please try again.';
            console.error('Error from AI:', data.error);
        }
    })
    .catch(error => {
        aiResponse.textContent = 'Failed to communicate with AI.';
        console.error('Error interacting with AI:', error);
    });
}

// Function to update the interaction count
function updateInteractionCount() {
    // Decrement the interaction count and update the display
    interactionCount--;
    const interactionCountElement = document.getElementById('interaction-count');
    interactionCountElement.textContent = `${interactionCount}/15`;

    // If all interactions are used, show the questionnaire
    if (interactionCount <= 0) {
        userInteractionArea.classList.add('hidden'); // Hide the user interaction area
        questionnaire.classList.remove('hidden'); // Show the questionnaire
    }
}
});