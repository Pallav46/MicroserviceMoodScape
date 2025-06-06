# **Emotion Detection API**

This project provides an API for detecting emotions in images using **DeepFace**.

---

## **Running the Application Locally**

### **1. Create a Virtual Environment**
```sh
python -m venv venv
```

### **2. Activate the Virtual Environment**
- **Mac/Linux:**
  ```sh
  source venv/bin/activate
  ```
- **Windows:**
  ```sh
  venv\Scripts\activate
  ```

### **3. Install Dependencies**
```sh
pip install -r requirements.txt
```

### **4. Download the ML Model from the given google drive link and place the file in this location**
```
download link: https://drive.google.com/file/d/1Dzk-i37RHhuH2QhDkyvzvgYiv99XPhfQ/view?usp=sharing
path: emotion-detection/ResNet50V2_Model_Checkpoint
```

### **5. Run the Application**
```sh
python run.py
```

By default, the API will start on **http://localhost:8000**.

---

## **Using the API**

### **Endpoint: `/detect-emotion`**
- **Method:** `POST`
- **Description:** Accepts an image and returns the dominant emotion.

#### **Example Request (Using cURL)**
```sh
curl -X POST http://localhost:8000/detect-emotion -F "image=@path/to/image.jpg"
```

#### **Example Response**
```json
{
  "emotion": "happy"
}
```

---

## **Docker Support**
You can also run this application inside a Docker container.

### **1. Build the Docker Image**
```sh
docker build -t emotion-detector .
```

### **2. Run the Docker Container**
```sh
docker run -p 8000:8000 emotion-detector
```

Now, the API will be available at **http://localhost:8000**.

---

## **License**
This project is open-source and available under the **MIT License**.

