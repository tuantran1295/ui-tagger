import os
import io
import base64
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import openai
from utils import call_gpt4_vision

app = FastAPI()

# For dev: allow all CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = os.getenv("OPENAI_API_KEY")


@app.post("/predict")
async def predict(file: UploadFile = File(...),
                  imageWidth: int = Form(...),
                  imageHeight: int = Form(...)
                  ):
    contents = await file.read()
    # Convert image to base64
    b64 = base64.b64encode(contents).decode()
    print(f"Received image size: {imageWidth}x{imageHeight}")
    prompt = f"""
    You are a UI bounding box assistant.

    You are given:
    - An app screenshot, exact pixel size: {imageWidth} x {imageHeight}.

    Task:
    - Enumerate every visible UI component (Button, Input, Radio, Dropdown).
    - Output the bounding box for each.
    - IMPORTANT: All bounding box coordinates ([x, y, width, height]) MUST BE in the coordinate system of the ORIGINAL IMAGE, not any resized/cropped/previewed version.
    - All coordinates must fit within [0, {imageWidth}-1] and [0, {imageHeight}-1].
    - Under NO CIRCUMSTANCES should you use any other image size or crop (even if your preview appears smaller).
    - Return bounding boxes as pixel coordinates in the format:
    [
      {{"box": [x, y, width, height], "tag": "Button"}},
      ...
    ]
    """
    resp = call_gpt4_vision(b64, prompt)
    return resp
