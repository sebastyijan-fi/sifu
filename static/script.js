document.addEventListener("DOMContentLoaded", () => {
  let navigatingToQuestionnaire = false;
  class InteractionManager {
    constructor() {
      this.interactionCount = 10;
      this.initDOMElements();
      this.addEventListeners();
    }

    initDOMElements() {
      this.participateButton = document.getElementById("participate-button");
      this.mainHeader = document.getElementById("main-header");
      this.mainContent = document.getElementById("main-content");
      this.interactionCounter = document.getElementById("interaction-counter");
      this.interactionCountElement = document.getElementById("interaction-count");
      this.avatarContainer = document.getElementById("avatar-container");
      this.aiResponse = document.getElementById("ai-response");
      this.userInteractionArea = document.getElementById("user-interaction-area");
      this.userInput = document.getElementById("user-input");
      this.submitButton = document.getElementById("submit-answer");
      this.assignmentContainer = document.getElementById("assignment-container");
      this.charCountElement = document.getElementById('char-count');
    }

    addEventListeners() {
      this.participateButton.addEventListener("click", () => this.startInteraction());
      this.submitButton.addEventListener("click", () => this.handleSubmit());
      this.userInput.addEventListener("keypress", event => this.handleKeyPress(event));
      this.userInput.addEventListener('input', () => this.updateCharacterCount());
    }

    startInteraction() {
      this.mainHeader.classList.add("hidden");
      this.mainContent.classList.remove("hidden");
      this.hideFooter();
      this.initializeInteraction();
    }

    async initializeInteraction() {
      try {
        const response = await fetch("/api/interaction", { method: "GET" });
        const data = await response.json();
        if (data.assignment && data.avatar && data.initial_ai_message) {
          this.assignmentContainer.textContent = data.assignment;
          this.avatarContainer.innerHTML = `<img src="/static/images/${data.avatar}" alt="Avatar">`;
          this.aiResponse.textContent = data.initial_ai_message; // Display the initial AI message
        } else {
          throw new Error("Failed to fetch initial data");
        }
      } catch (error) {
        console.error("Error initializing interaction:", error);
      }
    }

    hideFooter() {
      const footer = document.querySelector('footer');
      if (footer) {
        footer.style.display = 'none';
      }
    }

    handleKeyPress(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        this.submitButton.click();
      }
    }

    handleSubmit() {
      const trimmedInput = this.userInput.value.trim();
      if (trimmedInput) {
        this.sendUserInputToAI(trimmedInput);
        this.userInput.value = "";
      } else {
        alert("Please enter your response.");
      }
    }

    async sendUserInputToAI(input) {
      this.aiResponse.textContent = "Thinking...";
      try {
        const response = await fetch("/api/interaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_input: input,
            interaction_count: this.interactionCount // Include the interaction count here
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Oops, we haven't got JSON!");
        }

        const data = await response.json();
        if (!data.error) {
          this.aiResponse.textContent = data.message;
          this.updateInteractionCount();
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        this.aiResponse.textContent = "Failed to communicate with AI.";
        console.error("Error interacting with AI:", error);
        // You can further refine what is displayed based on the error type
        if (error instanceof TypeError) {
          this.aiResponse.textContent = "Unexpected response type received.";
        } else if (error.message.startsWith("HTTP error")) {
          this.aiResponse.textContent = "Server error occurred.";
        }
      }
    }

    updateInteractionCount() {
      this.interactionCount--;
      this.interactionCountElement.textContent = `${this.interactionCount}/10`;
      if (this.interactionCount <= 0) {
        // Give the user some time to read the last answer
        setTimeout(() => {
          // Show an alert box with a friendly message
          alert("Thank you for participating! We would really appreciate your feedback in our short questionnaire.");

          // Navigate to the questionnaire page
          this.navigateToQuestionnaire();
        }, 8000); // 5000 milliseconds delay (5 seconds)
      }
  }


    updateCharacterCount() {
      const maxLength = this.userInput.getAttribute('maxlength');
      const currentLength = this.userInput.value.length;
      this.charCountElement.textContent = maxLength - currentLength;
    }

    navigateToQuestionnaire() {
      navigatingToQuestionnaire = true;
      window.location.href = "/questionnaire";
    }

  }


  window.addEventListener("beforeunload", function (e) {
    if (!navigatingToQuestionnaire) {
      navigator.sendBeacon('/clear-session');
    }
  });


  new InteractionManager();
});
