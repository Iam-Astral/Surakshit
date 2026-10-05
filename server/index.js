import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs/promises';

dotenv.config();
const app = express();
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false
}));
app.use(express.json({ limit: '2mb' }));
const upload = multer({ dest: '/tmp/uploads/', limits: { fileSize: 20 * 1024 * 1024 } });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-3.8-flash';

const systemPrompt = `You are Surakshit, a health-information assistant. You help users understand information explicitly present in their uploaded medical records. You are NOT a doctor, do not diagnose, prescribe, or tell a user to start/stop/change medication. Do not invent facts. Clearly distinguish what the document says from general educational context. Encourage discussion with a qualified healthcare professional for clinical decisions. Keep answers understandable and concise.`;

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Surakshit API' }));

app.post('/api/analyze', upload.single('file'), async (req, res) => {
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured. Copy server/.env.example to server/.env and add your key.' });
  if (!req.file) return res.status(400).json({ error: 'Please upload a file.' });
  if (req.file.mimetype !== 'application/pdf') {
    await fs.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: 'For the live Gemini demo, upload a PDF medical record.' });
  }
  try {
   const uploaded = await ai.files.upload({
  file: req.file.path,
  config: {
    mimeType: 'application/pdf',
    displayName: req.file.originalname
  }
});
    const interaction = await ai.interactions.create({
      model: MODEL,
      input: [
        { type: 'text', text: `${systemPrompt}\n\nAnalyze the uploaded medical document. Return ONLY valid JSON with this shape: {"documentType":"","date":"","summary":"","conditions":[],"medications":[],"findings":[{"name":"","value":"","unit":"","referenceRange":"","status":"normal|below_range|above_range|unknown"}],"importantObservations":[],"questionsForDoctor":[]}. Only include information explicitly supported by the document. Use empty arrays or empty strings when unavailable.` },
        {
  type: 'document',
  uri: uploaded.uri,
  mime_type: uploaded.mimeType
}
      ],
      response_format: { type: 'text', mime_type: 'application/json' }
    });
    let raw = interaction.output_text || '{}';
    raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    let data;
    try { data = JSON.parse(raw); } catch { data = { documentType: 'Medical document', date: '', summary: raw, conditions: [], medications: [], findings: [], importantObservations: [], questionsForDoctor: [] }; }
    res.json({ fileName: req.file.originalname, model: MODEL, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Gemini analysis failed.' });
  } finally { await fs.unlink(req.file.path).catch(() => {}); }
});

app.post('/api/ask', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
  const { question, report } = req.body;
  if (!question || !report) return res.status(400).json({ error: 'Question and report context are required.' });
  try {
    const prompt = `${systemPrompt}\n\nHere is structured information extracted from the user's uploaded medical record:\n${JSON.stringify(report, null, 2)}\n\nUser question: ${question}\n\nAnswer using the supplied record as the primary source. If the record does not contain the answer, say that clearly. Do not diagnose or prescribe.`;
    const interaction = await ai.interactions.create({ model: MODEL, input: prompt });
    res.json({ answer: interaction.output_text, model: MODEL });
  } catch (err) { res.status(500).json({ error: err?.message || 'Gemini question failed.' }); }
});

export default app;
