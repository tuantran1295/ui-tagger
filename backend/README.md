# Backend: FastAPI for UI Tagging

Receives UI screenshots, sends them to GPT-4 Vision for bounding box tagging.

## Install & Run

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export OPENAI_API_KEY=sk-************************       
uvicorn main:app --reload
```