import numpy as np
import pandas as pd
import cv2
import keras
from tensorflow.keras.applications.resnet_v2 import preprocess_input
import time
import base64
import os
import logging

# Global singleton instance
_detector_instance = None

# Setup logger
logger = logging.getLogger(__name__)

class EmotionDetector:
    def __init__(self):
        """Initialize the EmotionDetector by loading the ResNet50V2 model, Haar Cascade, and music data."""
        logger.info("Loading models and data...")
        start_time = time.time()
        
        # Load the pre-trained ResNet50V2 model
        self.model = keras.saving.load_model('ResNet50V2_Model_Checkpoint/resnet50v2_best.keras')
        
        # Load the Haar Cascade for face detection
        self.face_cascade = cv2.CascadeClassifier('emotion_detector/haarcascade_frontalface_default.xml')
        if self.face_cascade.empty():
            raise FileNotFoundError("Haar Cascade file not found. Ensure 'haarcascade_frontalface_default.xml' is in the directory.")
        
        # Load the music data
        self.music_player = pd.read_csv("emotion_detector/data_moods.csv")
        self.music_player = self.music_player[['name', 'artist', 'mood', 'popularity']]
        
        # Define emotion classes
        self.emotion_classes = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
        
        # Enable verbose logging only in development
        self.verbose = os.environ.get('FLASK_ENV') == 'development'
        
        load_time = time.time() - start_time
        logger.info(f"Models and data loaded in {load_time:.2f} seconds.")

    @staticmethod
    def get_instance():
        """Get or create the singleton instance of EmotionDetector."""
        global _detector_instance
        if _detector_instance is None:
            _detector_instance = EmotionDetector()
        return _detector_instance

    def process_image_file(self, file):
        """Process an image from a file upload to detect emotion and recommend songs."""
        start_time = time.time()
        
        # Read and decode the image file
        filestr = file.read()
        npimg = np.frombuffer(filestr, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        decode_time = time.time()
        if self.verbose:
            logger.debug(f"Image decoding: {decode_time - start_time:.2f}s")
        
        return self._analyze_image(img, start_time, decode_time)

    def process_base64_image(self, image_data):
        """Process an image from a base64 string to detect emotion and recommend songs."""
        start_time = time.time()
        try:
            # Decode the base64 image
            encoded_data = image_data.split(',')[1]
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            decode_time = time.time()
            if self.verbose:
                logger.debug(f"Image decoding: {decode_time - start_time:.2f}s")
            return self._analyze_image(img, start_time, decode_time)
        except Exception as e:
            logger.error(f"Error processing base64 image: {str(e)}")
            return {'error': str(e)}

    def _analyze_image(self, img, start_time, decode_time):
        """Internal method to analyze the image, detect emotion, and recommend songs."""
        # Resize image to 640x480 for faster face detection
        img_resized = cv2.resize(img, (640, 480), interpolation=cv2.INTER_AREA)
        resize_time = time.time()
        if self.verbose:
            logger.debug(f"Image resizing: {resize_time - decode_time:.2f}s")
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
        
        # Detect faces using Haar Cascade
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        detection_time = time.time()
        if self.verbose:
            logger.debug(f"Face detection: {detection_time - resize_time:.2f}s")
        
        if len(faces) == 0:
            return {'error': 'No face detected'}
        
        # Select the largest face by area
        faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
        x, y, w, h = faces[0]
        
        # Scale face coordinates back to original image size
        scale_x = img.shape[1] / 640
        scale_y = img.shape[0] / 480
        x_orig = int(x * scale_x)
        y_orig = int(y * scale_y)
        w_orig = int(w * scale_x)
        h_orig = int(h * scale_y)
        
        # Extract the face region
        face_img = img[y_orig:y_orig + h_orig, x_orig:x_orig + w_orig]
        
        # Resize face to 224x224 (ResNet50V2 input size)
        face_img = cv2.resize(face_img, (224, 224), interpolation=cv2.INTER_AREA)
        
        # Preprocess the face image for the model
        face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)  # Convert BGR to RGB
        face_img = preprocess_input(face_img)  # Apply ResNet50V2 preprocessing
        face_img = np.expand_dims(face_img, axis=0)  # Add batch dimension
        preprocess_time = time.time()
        if self.verbose:
            logger.debug(f"Face preprocessing: {preprocess_time - detection_time:.2f}s")
        
        # Predict emotion using the ResNet50V2 model
        pred = self.model.predict(face_img, verbose=0)  # Disable prediction logging
        emotion_idx = np.argmax(pred)
        emotion = self.emotion_classes[emotion_idx]
        prediction_time = time.time()
        if self.verbose:
            logger.debug(f"Emotion prediction: {prediction_time - preprocess_time:.2f}s")
        
        # Recommend songs based on the detected emotion
        recommendations = self._recommend_songs(emotion)
        recommendation_time = time.time()
        if self.verbose:
            logger.debug(f"Song recommendation: {recommendation_time - prediction_time:.2f}s")
        
        total_time = time.time() - start_time
        if self.verbose:
            logger.debug(f"Total processing time: {total_time:.2f}s")
        
        return {
            'emotion': emotion,
            'recommendations': recommendations
        }

    def _recommend_songs(self, emotion):
        """Recommend songs based on the detected emotion."""
        # Map emotions to moods
        if emotion == 'Angry':
            mood = 'Energetic'
        elif emotion == 'Disgust':
            mood = 'Calm'
        elif emotion == 'Fear':
            mood = 'Energetic'
        elif emotion == 'Happy':
            mood = 'Happy'
        elif emotion == 'Neutral':
            mood = 'Calm'
        elif emotion == 'Sad':
            mood = 'Sad'
        elif emotion == 'Surprise':
            mood = 'Energetic'
        else:
            mood = 'Calm'
        
        # Filter songs by mood
        play = self.music_player[self.music_player['mood'] == mood]
        if len(play) == 0:
            return []
        elif len(play) < 5:
            selected = play
        else:
            selected = play.sample(n=5)  # Randomly select 5 songs
        
        # Convert to list of dictionaries
        recommendations = selected.to_dict(orient='records')
        return recommendations

# Example usage (uncomment to test)
if __name__ == "__main__":
    detector = EmotionDetector.get_instance()
    # Test with a file
    img_path="testImages/img3.jpg"
    with open(img_path, "rb") as file:
        result = detector.process_image_file(file)
        print(result)
    # Test with base64
    with open(img_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        image_data = f'data:image/jpeg;base64,{encoded_string}'
        result = detector.process_base64_image(image_data)
        print(result)