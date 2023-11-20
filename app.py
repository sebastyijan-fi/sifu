import os
import json
import logging
from flask import Flask, render_template, jsonify, request, send_from_directory, session
from flask_session import Session
from random import choice
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
import uuid


# Set up basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.secret_key = "weif32942jernfi2934f"

# Configure server-side session
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Directory for avatar images
AVATAR_DIR = "images"

@app.route("/")
def index():
    session.clear()
    return render_template("index.html")

@app.route("/questionnaire")
def quest():
    # Check if session_id exists, is valid, and questionnaire not yet submitted
    if not session.get('session_id') or session.get('submitted', False):
        return "Access Denied", 403  # or redirect to another page

    save_conversation_to_json()
    return render_template("questionnaire.html")


    save_conversation_to_json()
    return render_template("questionnaire.html")

@app.route("/clear-session", methods=["POST"])
def clear_session():
    # Preserve necessary data
    assignment_category = session.get('conversation_context', {}).get("assignment_category")
    assignment = session.get('assignment')

    session.clear()

    # Reassign necessary data to session
    preserved_data = {}
    if assignment_category:
        preserved_data["assignment_category"] = assignment_category
    if assignment:
        preserved_data["assignment"] = assignment

    if preserved_data:
        session['conversation_context'] = preserved_data

    return '', 204



@app.route("/api/interaction", methods=["GET", "POST"])
def interaction():
    if request.method == "GET":
        logging.info("Starting new conversation")

        # Generate a unique session ID
        session_id = str(uuid.uuid4())
        session['session_id'] = session_id
        session['submitted'] = False
        category, assignment, avatar = get_random_assignment_and_avatar()
        system_message, initial_ai_message = generate_initial_ai_response(assignment)
        session['assignment'] = assignment
        session['conversation_context'] = {
            "system_context": system_message,
            "conversation_history": [{"role": "assistant", "content": initial_ai_message}],
            "assignment_category": category  # Storing the category separately
        }
        return jsonify({
            "session_id": session_id,
            "assignment": assignment,
            "avatar": avatar,
            "initial_ai_message": initial_ai_message,
        })

    if request.method == "POST":
        user_input = request.json.get("user_input")
        logging.info(f"Received user input: {user_input}")
        ai_response = generate_ai_response(user_input)
        logging.info(f"AI response: {ai_response}")
        return jsonify({"message": ai_response})


def generate_initial_ai_response(assignment):
    system_message = (
        "You are a conversational AI. Please introduce yourself with a funny, reddit like non-human completely whacky name and even more whackier like non-human job title. Greet the user and engage in a friendly, helpful conversation but don't be a pushover! Repsond conversationally to the user and get the ball rolling. Max 75-100 words!! with the user's assignment: '{}'.".format(assignment)
    )
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-1106",
            messages=[{"role": "user", "content": system_message}],
        )
        initial_ai_message = response.choices[0].message.content if hasattr(response, "choices") else None
        return system_message, initial_ai_message
    except Exception as e:
        return system_message, f"Error generating initial response: {e}"

def get_random_assignment_and_avatar():
    with open("aks.json", "r") as file:
        aks = json.load(file)
    category, assignments = choice(list(aks.items()))
    assignment = choice(assignments)
    avatars = os.listdir(os.path.join(app.static_folder, AVATAR_DIR))
    avatar = choice([avatar for avatar in avatars if avatar.endswith(".png")])
    return category, assignment, avatar

def generate_ai_response(user_input):
    conversation_context = session.get('conversation_context', {})
    ongoing_system_message = (
        "Continue the conversation in a friendly and helpful manner. Keep using your established persona. Answer like you would talk in a conversation. Do not be overly AI. Max 100 words replies!! Remember to stay on topic, if user prompts you about other issues, in  friendly way guide the chat back to the assignment(IMPORTANT!!!)!!!!. Also make sure you space your paragraphs correctly so it's easy to read"
    )
    conversation_history = conversation_context.get("conversation_history", [])
    messages = [{"role": "system", "content": ongoing_system_message}] + conversation_history + [{"role": "user", "content": user_input}]

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-1106",
            messages=messages,
            timeout=10  # Set a timeout for the request
        )
        if hasattr(response, "choices"):
            ai_response = response.choices[0].message.content
            update_conversation_context(user_input, ai_response)
            return ai_response
        else:
            return "Error: Response from OpenAI API is missing expected data."
    except Exception as e:
        return f"Error generating response: {e}"


def update_conversation_context(user_input=None, ai_response=None):
    conversation_context = session.get('conversation_context', {})
    if user_input:
        conversation_context["conversation_history"].append({"role": "user", "content": user_input})
    if ai_response:
        conversation_context["conversation_history"].append({"role": "assistant", "content": ai_response})
    session['conversation_context'] = conversation_context



@app.route("/api/submit-questionnaire", methods=["POST"])
def submit_questionnaire():
    # Check if the questionnaire has already been submitted
    if session.get('submitted', False):
        return jsonify({"error": "Already submitted", "success": False})

    # Retrieve the category from the session
    assignment_category = session.get('conversation_context', {}).get("assignment_category", "Unknown")

    # Prevent submission if the category is 'Unknown'
    if assignment_category == "Unknown":
        return jsonify({"error": "Invalid submission due to unknown category", "success": False})

    # Process the submission
    data = request.json
    try:


        with open('questionnaire_responses.json', mode='a') as file:
            record = {
                'timestamp': datetime.utcnow().isoformat(),
                'category': assignment_category,
                'responses': data
            }
            file.write(json.dumps(record) + "\n")

        # Mark the questionnaire as submitted
        session['submitted'] = True

        # Clear the session
        session.clear()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False})


def save_conversation_to_json():
    conversation_context = session.get('conversation_context', {})
    assignment = session.get('assignment')

    if conversation_context:
        conversation_data = {
            "conversation_context": conversation_context,
            "assignment": assignment
        }

        filename = f"conversations/conversation_{uuid.uuid4()}.json"
        with open(filename, 'w') as file:
            json.dump(conversation_data, file, indent=4)
        logging.info(f"Conversation saved to {filename}")


@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)

if __name__ == "__main__":
    app.run(port=7666)
