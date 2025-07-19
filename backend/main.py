import os
import io
import base64
from fastapi import FastAPI, File, UploadFile
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
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    # Convert image to base64
    b64 = base64.b64encode(contents).decode()
    prompt = """
You are a UI tagging assistant. Given an app screenshot, enumerate all UI components that are visible and tag them as ONE of: Button, Input, Radio, Dropdown. Draw a tight box for each component. Reply ONLY in this compact JSON list format:
[
  {"box": [x, y, width, height], "tag": "Button"},
  ...
]
(x, y) is the top-left image pixel. Ignore all non-UI parts.
No other text. Only a valid JSON array.
    """
    resp = call_gpt4_vision(b64, prompt)
    return resp
