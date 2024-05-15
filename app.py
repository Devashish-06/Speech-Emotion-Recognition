import os
from tqdm import tqdm
from flask import Flask,render_template, request, jsonify
import joblib
import librosa as lr
import os, glob, pickle
import librosa
from scipy import signal
import numpy as np
import pickle

app = Flask(__name__)
model = joblib.load(r'Emotion_Voice_Detection_Model.pkl')


@app.route('/')
def home():
     return render_template('index.html')

# Function to extract features from an audio file
def extract_features(audio_file):
    data, sr = librosa.load(audio_file, sr=16000)  # Load audio with a specific sampling rate
    mfccs = librosa.feature.mfcc(y=data, sr=sr, n_mfcc=40)
    chroma = librosa.feature.chroma_stft(y=data, sr=sr)
    mel = librosa.feature.melspectrogram(y=data, sr=sr)
    return np.concatenate((mfccs.mean(axis=1), chroma.mean(axis=1), mel.mean(axis=1)))

# @app.route('/upload', methods=['POST'])
# def upload():
#     if 'audio' not in request.files:
#         return 'No audio file provided', 400

#     audio_file = request.files['audio']
#     # Do something with the audio file, e.g., save it to disk
#     audio_file.save('uploaded_audio.wav')

#     return 'Audio file uploaded successfully'

@app.route('/predict', methods=['POST'])
def predict():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    # Get audio file from request
    audio_file = request.files['audio']

    # Save the audio file
    audio_file.save('uploaded_audio.wav')

    # Extract features from the uploaded audio file
    features = extract_features('uploaded_audio.wav')


    # Use the model to make predictions
    prediction = model.predict(features.reshape(1, -1))

    # Map the prediction index to the corresponding emotion label
    # emotion_mapping = {0: 'neutral', 1: 'calm', 2: 'happy', 3: 'sad', 4: 'angry', 5: 'fearful', 6: 'disgust', 7: 'surprised'}
    predicted_emotion = prediction[0]

    # Return predicted emotion as JSON response
    return jsonify({'predicted_emotion': predicted_emotion})

if __name__ == "__main__":
    app.run(debug=True)
