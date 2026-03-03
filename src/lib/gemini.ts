import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

// ENV = GEMINI_API_KEY
const ai = new GoogleGenAI({});

export default ai;