from pathlib import Path
import json

import numpy as np
import tensorflow as tf
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "skinai_final.keras"
CLASS_NAMES_PATH = BASE_DIR / "models" / "class_names.json"

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "skinai_final.keras"
CLASS_NAMES_PATH = BASE_DIR / "models" / "class_names.json"

FRONTEND_DIR = BASE_DIR / "frontend"

IMG_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.80


app = FastAPI(
    title="SkinAI API",
    description="Educational skin image classification API",
    version="1.0.0"
)

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


try:
    model = tf.keras.models.load_model(MODEL_PATH)

    with open(CLASS_NAMES_PATH, "r") as file:
        class_names = json.load(file)

except Exception as error:
    model = None
    class_names = []
    print("Model loading error:", error)


@app.get("/")
def root():
    return FileResponse(
        FRONTEND_DIR / "index.html"
    )


@app.get("/health")
def health():
    return {
        "status": "healthy" if model is not None else "model_error",
        "model_loaded": model is not None,
        "classes": class_names
    }


def preprocess_image(image: Image.Image):

    image = image.convert("RGB")
    image = image.resize(IMG_SIZE)

    image_array = np.array(image).astype(np.float32)

    image_array = tf.keras.applications.mobilenet_v2.preprocess_input(
        image_array
    )

    image_array = np.expand_dims(
        image_array,
        axis=0
    )

    return image_array


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    if model is None:
        raise HTTPException(
            status_code=500,
            detail="Model is not loaded."
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are supported."
        )

    try:

        image_data = await file.read()

        image = Image.open(
            __import__("io").BytesIO(image_data)
        )

        processed_image = preprocess_image(image)

        predictions = model.predict(
            processed_image,
            verbose=0
        )[0]

        predicted_index = int(
            np.argmax(predictions)
        )

        confidence = float(
            predictions[predicted_index]
        )

        predicted_class = class_names[predicted_index]

        top_indices = np.argsort(predictions)[::-1][:3]

        top_predictions = []

        for index in top_indices:
            top_predictions.append({
                "class": class_names[index],
                "confidence": round(
                    float(predictions[index]) * 100,
                    2
                )
            })

        accepted = confidence >= CONFIDENCE_THRESHOLD

        return {
            "prediction": predicted_class,
            "confidence": round(confidence, 4),
            "confidence_percent": round(
                confidence * 100,
                2
            ),
            "accepted": accepted,
            "threshold": CONFIDENCE_THRESHOLD,
            "top_predictions": top_predictions
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )