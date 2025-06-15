# **App Name**: CAF MedRoute

## Core Features:

- Secure Login: Secure user authentication via CAF credentials or email.
- AI Triage Chatbot: AI-powered chat interface using LLaMA 4 Maverick via OpenRouter for symptom triage.
- Policy-Driven Routing: Use LLaMA 4 Scout tool to reference CAF medical policies and routing rules to aid in appointment recommendation.
- Appointment Recommendation: Display appointment recommendations including sick parade, GP, mental health, physio, specialist, or ER referral.
- Data Logging: Store chat logs and recommendations in Firestore, linked to user ID with timestamping.
- Admin Dashboard: Admin dashboard for viewing triage transcripts and system decisions.
- Emergency Protocols: Emergency response workflow triggered by specific keywords (e.g., suicidal ideation).

## Style Guidelines:

- Primary color: Slate blue (#778DA9) for a professional and calming feel, suitable for a medical application.
- Background color: Light gray (#F0F0F0) to provide a clean, neutral backdrop.
- Accent color: Soft teal (#90B4BE) to highlight key actions and information.
- Body and headline font: 'Inter' (sans-serif) for a modern, objective, neutral look, ensuring readability.
- Use clear, professional icons to represent appointment types and actions.
- Design a clean, responsive bilingual (EN/FR) interface.
- Use subtle transitions to indicate loading or process completion.