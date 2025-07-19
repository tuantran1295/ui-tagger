# UI Tagging Assistant (React + FastAPI + GPT-4 Vision)

This project provides an end-to-end tool for annotating UI screenshots, leveraging Large Language Models (LLMs) with vision capabilities for automatic element detection and comparison with manually created ground truth.

---

## Features

- **Frontend (React):**
  - Upload UI screenshots
  - Draw bounding boxes and tag UI elements (Button, Input, Radio, Dropdown)
  - Save annotations as JSON
  - Request auto-annotation from an LLM via backend API
  - Overlay and compare LLM predictions with your own annotations

- **Backend (FastAPI):**
  - Receives image uploads from frontend
  - Queries OpenAI GPT-4 Vision with a prompt for UI detection
  - Returns predicted bounding boxes/tags as JSON

- **Evaluation Script:**
  - Compares ground truth and LLM predictions
  - Outputs per-tag Precision, Recall, and F1 scores

---

## Project Structure

```
ui-tagger/
│
├── frontend/
│   ├── package.json
│   ├── src/
│   └── public/
│
├── backend/
│   ├── main.py
│   ├── utils.py
│   └── requirements.txt
│
├── evaluate.py
├── README.md
└── .gitignore
```

---

## Getting Started

### 1. Frontend (React)

#### Setup & Run

```bash
cd frontend
npm install
npm start
```

Access app at: [http://localhost:3000](http://localhost:3000)

#### Features

- Upload your UI screenshot
- Draw boxes, assign tags, and delete boxes
- Save annotation as JSON
- Click “Predict” to request auto-tagging from the backend

> **Note:** By default, the frontend will call the backend at `http://localhost:8000/predict`.
> Adjust this in code if your backend runs somewhere else.

---

### 2. Backend (Python + FastAPI)

#### Prerequisites

- Python 3.9+
- An OpenAI API key **with access to GPT-4 Vision**

#### Setup & Run

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export OPENAI_API_KEY=sk-************************        # Replace with your key
uvicorn main:app --reload
```

API will be available at: [http://localhost:8000](http://localhost:8000)

---

### 3. Evaluate LLM vs Ground Truth

Suppose you have two folders:

- `ground_truth/` — your saved annotation JSONs
- `llm_predictions/` — LLM-generated annotation JSONs with matching filenames

Run:

```bash
python evaluate.py --ground_truth ground_truth/ --predictions llm_predictions/
```

The script will show per-class precision, recall, and F1 score tables.

---

## What’s Included

- Complete frontend with React, Konva.js, Material-UI components
- FastAPI backend with clear CORS and OpenAI API integration
- Modular, human-readable Python code for both serving and evaluation
- Instructions for quick start and future extension

---
