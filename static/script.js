let mediaRecorder;
let audioChunks = [];
let isSpeaking = false;
let audioResponse = new Audio();

document.addEventListener('keydown', function(event) {
    if (event.key === 'r') {
        if (isSpeaking) {
            stopSpeaking();
        } else {
            startSpeaking();
        }
    }
});

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            mediaRecorder.onstop = sendAudioToBackend;
            mediaRecorder.start();
        });
}

function stopRecording() {
    mediaRecorder.stop();
}

function sendAudioToBackend() {
    let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

    // Here, you'd typically send the audioBlob to your backend for processing
    // and await the AI's response.
    // Once you have the AI's audio response, play it for the user.
    audioResponse.src = URL.createObjectURL(audioBlob); // Replace this with the AI's response URL
    audioResponse.play();
}

audioResponse.addEventListener('ended', function() {
    isSpeaking = false;
});

function startSpeaking() {
    if (!isSpeaking) {
        isSpeaking = true;
        const aiEntity = document.getElementById('aiEntity');
        aiEntity.style.animation = 'kittLights 0.5s infinite';
        startRecording();
    }
}

function stopSpeaking() {
    if (isSpeaking) {
        isSpeaking = false;
        const aiEntity = document.getElementById('aiEntity');
        aiEntity.style.animation = 'none';
        stopRecording();
        audioResponse.pause();
        audioResponse.currentTime = 0;
    }
}
