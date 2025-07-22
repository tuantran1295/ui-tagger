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
    You are a UI tagging assistant. Given an app screenshot of size {imageWidth}x{imageHeight}, enumerate all UI components visible in the image. Tag each as ONE of: Button, Input, Radio, Dropdown. 
    Return bounding boxes as pixel coordinates in the format:
    [
      {{"box": [x, y, width, height], "tag": "Button"}},
      ...
    ]
    - (x, y) is the top-left corner in the ORIGINAL image size.
    - Do NOT return any text, only a valid JSON array.
    - Do NOT scale to GPT’s resized image dimensions.
    - Use accurate pixel-based coordinates matching the input size {imageWidth}x{imageHeight}.
    """
    resp = call_gpt4_vision(b64, prompt)
    return resp
