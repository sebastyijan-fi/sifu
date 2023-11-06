import os
from flask import Flask, render_template, jsonify, send_from_directory, request
from random import choice, randint
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

# Directory for avatar images
AVATAR_DIR = 'images'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/random-avatar')
def random_avatar():
    try:
        # Get a list of avatars
        avatars = os.listdir(os.path.join(app.static_folder, AVATAR_DIR))
        avatars = [avatar for avatar in avatars if avatar.endswith('.png')]
        # Pick a random avatar and send the filename
        random_avatar = choice(avatars)
        return jsonify({'avatar': random_avatar})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-assignment')
def get_assignment():
    assignments = [
        'Plan your next holiday',
        'Organize a birthday party for a friend',
        'Come up with a fitness routine',
        # ... other assignments ...
    ]
    random_assignment = choice(assignments)
    return jsonify({'assignment': random_assignment})

@app.route('/api/interaction/<int:count>')
def interaction(count):
    # Assuming a max of 15 interactions
    total_interactions = 15
    interactions_left = max(total_interactions - count, 0)
    return jsonify({'interactions_left': interactions_left})

@app.route('/api/generate-message', methods=['POST'])
def generate_message():
    data = request.json
    user_input = data.get('user_input')

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Reply with max 75 words. You should aanswer in a conversational manner to the user. So no points, lists..etc..Talk to me like a human being with emotions and realism."},
                {"role": "user", "content": user_input}
            ]
        )
        message = response.choices[0].message['content']
        return jsonify({'message': message})
    except openai.error.OpenAIError as e:
        return jsonify({'error': str(e)}), 500

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(port=7666)
