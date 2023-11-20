document.addEventListener("DOMContentLoaded", () => {
    const questionnaireForm = document.getElementById("aiQuestionnaire");

    // This code should be placed in the script that runs on the questionnaire page
window.addEventListener("load", function (e) {
    fetch('/clear-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
});


    questionnaireForm.addEventListener("submit", function(event) {
        event.preventDefault(); // Stop the form from submitting the traditional way

        const formData = new FormData(questionnaireForm);
        const formProps = Object.fromEntries(formData);

        // Send the form data to the server
        fetch('/api/submit-questionnaire', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formProps),
        })
        .then(response => response.json())
        .then(data => {
            // Handle the response from the server
            if (data.success) {
                // Clear the session before redirecting
                fetch('/clear-session', { method: 'POST' })
                .then(() => {
                    alert("Thank you for participating in this study. Your feedback is invaluable.");
                    window.location.href = "/";
                });
            } else {
                // Handle errors
                console.error('An error occurred:', data.error);
            }
        })
        .catch(error => {
            console.error('Error submitting form:', error);
        });
    });
});
