from flask import Flask, render_template_string
from flask_socketio import SocketIO
from .config.settings import config
from .routes.emotion_routes import emotion_bp
from .services.socket_service import SocketService
import logging

def create_app(config_object=config):
    """Application factory function"""
    # Initialize Flask
    app = Flask(__name__)
    
    # Setup logging
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger(__name__)
    
    # Load configuration
    app.config.from_object(config_object)
    app.config['SECRET_KEY'] = 'secret!'  # Required for SocketIO
    
    # Initialize SocketIO with WebSocket support
    socketio = SocketIO(
        app,
        cors_allowed_origins="*",
        async_mode=None,  # Let SocketIO choose the best mode
        logger=True,
        engineio_logger=True
    )
    
    # Register blueprints
    app.register_blueprint(emotion_bp)
    
    # Initialize socket service
    socket_service = SocketService(socketio)
    
    # Simple HTML page with WebSocket test
    @app.route('/')
    def index():
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Emotion Detection Service</title>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
            <script type="text/javascript">
                var socket = io();
                socket.on('connect', function() {
                    console.log('Connected to server');
                });
                socket.on('emotion_result', function(data) {
                    console.log('Received:', data);
                });
            </script>
        </head>
        <body>
            <h1>Emotion Detection Service</h1>
            <p>Status: Running</p>
            <p>Check console for WebSocket messages</p>
        </body>
        </html>
        """
        return render_template_string(html)
    
    logger.info("Application created successfully")
    return app, socketio 