# Surakshit — Gemini-Powered Health Context

**Your Health. Your Data. Your Control.**

Surakshit is a hackathon prototype that lets a patient upload a medical PDF, uses the Google Gemini API to understand the document, extracts structured health information, and answers questions grounded in that uploaded record. It also includes a consent-oriented patient → doctor sharing demo.

## Stack
- Frontend: React + Vite + CSS
- Backend: Node.js + Express
- AI: Google Gemini API via `@google/genai`
- Document understanding: Gemini Files API + Interactions API

Google's current Gemini documentation shows the official JavaScript SDK as `@google/genai`; the Files API is recommended when a document will be reused across requests, and Gemini can process PDFs natively. See the official docs linked below.

## Run locally

### 1. Requirements
- Node.js 20+
- A Gemini API key

### 2. Install
```bash
npm install
npm run install:all
```

### 3. Configure Gemini
Copy `server/.env.example` to `server/.env` and add:
```env
GEMINI_API_KEY=YOUR_KEY_HERE
PORT=5000
```

**Never commit `server/.env` or expose the API key in React.**

### 4. Start
```bash
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## Demo flow
1. Open the frontend.
2. Go to **My Records**.
3. Upload a sample medical PDF.
4. Click **Analyze with Gemini**.
5. Review the structured findings and summary.
6. Open **AI Assistant** and ask a question about the report.
7. Open **Sharing & Consent**, grant access to the demo doctor.
8. Switch the role selector to **Doctor** to demonstrate the authorized view.

## Important demo safety note
Use synthetic/demo medical records for a public hackathon demo. Do not upload real patient records to a repository, and do not commit API keys.

Surakshit is an information-understanding tool, not a diagnostic or prescribing system. Clinical decisions should remain with qualified healthcare professionals.

## Official Gemini references
- https://ai.google.dev/gemini-api/docs/get-started
- https://ai.google.dev/gemini-api/docs/document-processing
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/api-key
