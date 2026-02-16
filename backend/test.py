from google import genai

client = genai.Client(api_key="AIzaSyBl20VCma3oP8I1N8Uug5hOhq0mTFpgE4M")
response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="Explain how AI works in a few words"
)
print(response.text)