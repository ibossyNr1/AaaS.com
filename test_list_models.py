import subprocess
import requests
import json

def get_token():
    return subprocess.check_output(['gcloud', 'auth', 'print-access-token']).decode().strip()

project = 'project-c46053a6-17b9-4914-8ed'
location = 'us-central1'
url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models"

print(f"Listing models from: {url}")
try:
    token = get_token()
    resp = requests.get(url, headers={'Authorization': f'Bearer {token}'})
    if resp.status_code == 200:
        models = resp.json().get('publisherModels', [])
        print(f"Found {len(models)} models.")
        for m in models:
            # Check if it's a Gemini model
            name = m.get('name', '')
            if 'gemini' in name:
                print(f" - {name}")
    else:
        print(f"Error: {resp.status_code}")
        print(resp.text)
except Exception as e:
    print(f"Exception: {e}")
