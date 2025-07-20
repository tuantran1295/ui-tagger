import openai
import re
import json

def call_gpt4_vision(b64_image, prompt):
    image_url = f"data:image/png;base64,{b64_image}"
    completion = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a computer vision JSON tagging bot."},
            {"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_url}}
            ]}
        ],
        max_tokens=1024,
    )
    text = completion.choices[0].message.content
    # Extract JSON block
    try:
        match = re.search(r'\[\s*{[\s\S]+}\s*\]', text)
        if match:
            data = json.loads(match.group(0))
            # Optionally: filter/validate fields here
            return data
        else:
            return []
    except Exception as e:
        print("Error in parsing LLM output:", e)
        return []
