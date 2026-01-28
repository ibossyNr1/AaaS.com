import os
import requests
import json
import sys

def load_env():
    """
    Manually loads .env file if it exists.
    """
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, _, value = line.partition('=')
                    if key and value:
                        os.environ[key.strip()] = value.strip()

def test_gemini():
    load_env()
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("Error: GOOGLE_API_KEY not found in environment variables.")
        sys.exit(1)

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    try:
        print(f"Listing available models...")
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ API Key Works! Available Models:")
            for m in data.get('models', []):
                if 'generateContent' in m.get('supportedGenerationMethods', []):
                    print(f" - {m['name']}")
        else:
            print(f"❌ Verification Failed (Status {response.status_code})")
            print(response.text)
            sys.exit(1)

    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Google API: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_gemini()
