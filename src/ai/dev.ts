import { config } from 'dotenv';
config();

import '@/ai/flows/triage-chatbot.ts';
import '@/ai/flows/policy-based-routing.ts';