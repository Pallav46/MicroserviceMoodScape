# Use the official Python image from Docker Hub
FROM python:3.11

# Set the working directory in the container
WORKDIR /usr/src/app

# Install system dependencies required for OpenCV and other packages
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file to optimize Docker build caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the Flask application with SocketIO support
CMD ["python", "run.py"]