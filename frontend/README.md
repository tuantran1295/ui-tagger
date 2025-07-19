# UI Tagging Tool (Frontend)

A web UI toolkit for annotating UI screenshots (React + Konva + Material UI).

## Features

- Upload a screenshot.
- Draw bounding boxes by dragging the mouse.
- Assign tags (Button, Input, Radio, Dropdown).
- Save annotations as JSON.
- Predict (call backend for GPT-4 Vision tagging, boxes overlaid in green).

---

## Installation

```sh
git clone <repo>        # Or simply cd frontend/
cd frontend
npm install
npm start
```

### Annotation format
```
[
{"box": [x, y, width, height], "tag": "Button"}
] 
```

