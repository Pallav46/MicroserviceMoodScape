from flask import Blueprint, request, jsonify
from emotion_detector import EmotionDetector

# Create blueprint for emotion routes
emotion_bp = Blueprint('emotion', __name__)

# Initialize EmotionDetector as singleton
detector = EmotionDetector.get_instance()

@emotion_bp.route('/detect-emotion', methods=['POST'])
def detect_emotion():
    """
    Endpoint for emotion detection from uploaded images
    Returns:
        JSON response with emotion or error
    """
    # Check if an image file is provided
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    result = detector.process_image_file(file)
    # print("Result:", result)
    
    if 'error' in result:
        return jsonify(result), 400
    return jsonify(result) 