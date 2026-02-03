import os
import requests
import subprocess

def get_access_token():
    try:
        result = subprocess.run(['gcloud', 'auth', 'print-access-token'], capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except Exception as e:
        print(f"Error getting access token: {e}")
        return None

def test_vertex_ai():
    project_id = 'project-c46053a6-17b9-4914-8ed'
    location = 'us-central1'
    # Use a specific model version that is widely available
    model_id = 'gemini-1.0-pro'
    url = f"https://{location}-aiplatform.googleapis.com/v1beta1/projects/{project_id}/locations/{location}/publishers/google/models/{model_id}:generateContent"
    
    token = get_access_token()
    if not token:
        print("Failed to get OAuth token. Please run 'gcloud auth login' and 'gcloud auth application-default login'.")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{"text": "Hello! I am testing my Vertex AI setup. Are you working?"}]
        }]
    }
    
    print(f"Testing Vertex AI endpoint: {url}")
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        print("✅ SUCCESS: Vertex AI is active and reachable via OAuth!")
        print("Response:", response.json()['candidates'][0]['content']['parts'][0]['text'])
    else:
        print(f"❌ FAILED: Status {response.status_code}")
        print("Error Details:", response.text)

if __name__ == "__main__":
    test_vertex_ai()
