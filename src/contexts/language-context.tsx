
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string; // Translation function
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Placeholder translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: "CAF MedRoute",
    loginTitle: "Login to CAF MedRoute",
    loginDescription: "Enter your credentials to access your account.",
    loginSuccessTitle: "Login Successful",
    loginSuccessDesc: "Welcome back!",
    loginErrorTitle: "Login Failed",
    loginErrorDesc: "Please check your credentials and try again.",
    chatWithAI: "Chat Assistant", // Changed for sidebar
    send: "Send",
    typeYourMessage: "Type your message...",
    adminDashboard: "Admin Dashboard",
    logout: "Logout",
    user: "User",
    assistant: "Assistant",
    system: "System",
    signupTitle: "Create Account",
    signupDescription: "Create an account to get started.",
    displayNameLabel: "Display Name (Optional)",
    displayNamePlaceholder: "Your Name",
    signupSuccessTitle: "Account Created",
    signupSuccessDesc: "Welcome! You're now logged in.",
    signupErrorTitle: "Signup Failed",
    signupErrorDesc: "Could not create account. Please try again.",
    emailLabel: "Email",
    passwordLabel: "Password",
    loginButton: "Login",
    signupButton: "Sign Up",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    triageResults: "Triage Results",
    triageResultsDescription: "Based on your input, here is our recommendation:",
    recommendation: "Recommendation",
    reasonLabel: "Reason",
    emergencyTitle: "EMERGENCY",
    emergencyMessage: "It seems you might need urgent help. Please contact emergency services (911) or proceed to the nearest emergency room immediately. If you are on a base, follow local emergency protocols.",
    chatInputFormLabel: "Chat input form",
    attachFile: "Attach file",
    errorSavingSessionTitle: "Error Saving Session",
    errorSavingSessionDesc: "Could not save the triage session.",
    aiErrorTitle: "AI Error",
    aiErrorDesc: "Could not get a response from the assistant.",
    aiError: "Sorry, I encountered an issue. Please try again.",
    loadingSessions: "Loading triage sessions...",
    errorFetchingSessions: "Failed to load triage sessions. Please try again.",
    errorTitle: "Error",
    noTriageSessions: "No triage sessions found.",
    triageSessionsListDesc: "A list of recent triage sessions.",
    tableHeaderTimestamp: "Timestamp",
    tableHeaderUserID: "User ID",
    tableHeaderRecommendation: "Recommendation",
    tableHeaderLanguage: "Language",
    tableHeaderEmergency: "Emergency",
    tableHeaderActions: "Actions",
    viewDetailsButton: "View",
    triageSessionDetailsTitle: "Triage Session Details",
    sessionIdLabel: "Session ID",
    userIdLabel: "User ID",
    timestampLabel: "Timestamp",
    languageLabel: "Language",
    emergencyTriggeredLabel: "Emergency Triggered",
    yes: "Yes",
    no: "No",
    notAvailable: "Not available",
    notAvailableShort: "N/A",
    chatTranscript: "Chat Transcript",
    closeButton: "Close",
    loadingAdmin: "Loading admin section...",
    adminAccessDenied: "Access Denied. You are not an administrator.",
    adminNotAuthenticated: "Please login to access this section.",
    backToApp: "Back to App",
    toggleLanguage: "Switch to {{lang}}",
    urgentActionRequired: "Urgent Action Required:",
    erReferralInstruction: "Please proceed to the nearest Emergency Room immediately or contact emergency services (911).",
    initialChatGreetingEn: "Hello! I'm your CAF MedRoute medical assistant. How can I help you today regarding your symptoms, injury, or occupational needs?",
    initialChatGreetingFr: "Bonjour ! Je suis votre assistant médical CAF MedRoute. Comment puis-je vous aider aujourd'hui concernant vos symptômes, blessures ou besoins professionnels ?",
    prepareForClinicButton: "Prepare for Clinic",
    prepareForClinicButtonShort: "Prep Clinic",
    prepareForClinicModalTitle: "Prepare Session for Clinic Scheduling",
    prepareForClinicModalDesc: "Review the session details formatted for clinic use. You can copy this information to assist with scheduling.",
    patientReferralTitle: "PATIENT REFERRAL FOR CLINIC SCHEDULING",
    dateGeneratedLabel: "Date Generated",
    recommendedAppointmentLabel: "Recommended Appointment Type",
    aiTriageSummaryLabel: "AI Triage Summary & Reason",
    emergencyAlertDuringTriageLabel: "Emergency Alert During Triage",
    followEmergencyProtocols: "Follow emergency protocols if applicable",
    forClinicUseTitle: "FOR CLINIC USE:",
    patientNameLabel: "Patient Name (if known)",
    patientContactNumberLabel: "Patient Contact Number",
    unitSectionLabel: "Unit / Section (if applicable)",
    appointmentScheduledLabel: "Appointment Scheduled",
    scheduledDateTimeLabel: "Scheduled Date & Time",
    clinicianAssignedLabel: "Clinician Assigned",
    confirmationSentLabel: "Confirmation Sent to Member",
    clerkInitialsLabel: "Clerk Initials",
    notesLabel: "Notes",
    chatTranscriptSnippetTitle: "Chat Transcript Snippet (Last few messages for context)",
    copyToClipboardButton: "Copy to Clipboard",
    copiedToClipboardMessage: "Copied to clipboard!",
    copyToClipboardFailed: "Failed to copy.",
    noChatHistoryAvailable: "No chat history available.",
    invalidDate: "Invalid Date",
    schedulingSidebarTitle: "Next Steps",
    appointmentTypeLabel: "Appointment Type:",
    scheduleButton: "Schedule Appointment",
    scheduleFunctionalityComingSoon: "Scheduling functionality is coming soon!",
    scheduleRequestNotedTitle: "Scheduling Request Noted",
    scheduleRequestNotedDesc: "Clinic staff will follow up based on your triage. You can now close this panel or continue chatting.",
    tableHeaderComplexity: "Complexity",
    tableHeaderReason: "Reason",
    referencesMenuItem: "References",
    referencesPageTitle: "References & LLM Prompts",
    referencesPageDesc: "This page contains information about the policies, guidelines, and the exact prompts used by the AI assistant.",
    placeholderSectionTitle: "Content Coming Soon",
    placeholderSectionContent: "The specific references and source materials that inform the AI's responses regarding CAF medical policies and routing rules will be detailed here. This ensures transparency and allows users to understand the basis of the AI's recommendations.",
    placeholderCheckBack: "Please check back later for updated information.",
    triageChatbotPromptTitle: "Triage Chatbot (LLaMA 4 Maverick) Core Prompt",
    triageChatbotPromptDesc: "This is the main prompt used by the AI model for the triage chatbot flow (via Genkit ai.definePrompt). Handlebars ({{...}}) are used for templating chat history and user input. The AI adopts the LLaMA 4 Maverick persona.",
    triageChatbotPromptDesc_Llama4Maverick: "This is the main prompt used by the AI model LLaMA 4 Maverick (via OpenRouter / Genkit ai.definePrompt) for the triage chatbot flow. Handlebars ({{...}}) are used for templating chat history and user input.",
    policyRoutingPromptsTitle: "Policy-Based Routing (LLaMA 4 Scout Persona) Prompts",
    policyRoutingPromptsTitle_Llama4Scout: "Policy-Based Routing (LLaMA 4 Scout) Prompts",
    policyRoutingGenkitPromptLabel: "Genkit Flow Prompt (Main AI)",
    policyRoutingGenkitPromptDesc: "This prompt instructs the main AI model (via Genkit) to use the \"getCaFRoutingRecommendation\" tool for policy-based routing. The tool internally uses an AI with the LLaMA 4 Scout persona.",
    policyRoutingGenkitPromptDesc_Llama4Scout: "This prompt instructs the main AI model (LLaMA 4 Maverick via Genkit) to use the \"getCaFRoutingRecommendation\" tool for policy-based routing. The tool internally uses the LLaMA 4 Scout model via OpenRouter.",
    policyRoutingOpenRouterSystemPromptLabel: "OpenRouter Tool: System Prompt (LLaMA 4 Scout Persona)",
    policyRoutingOpenRouterSystemPromptDesc: "This is the system prompt sent to the LLaMA 4 Scout model via OpenRouter within the \"getCaFRoutingRecommendation\" tool.",
    policyRoutingOpenRouterSystemPromptDesc_Llama4Scout: "This is the system prompt sent to the LLaMA 4 Scout model via OpenRouter within the \"getCaFRoutingRecommendation\" tool.",
    policyRoutingOpenRouterUserPromptLabel: "OpenRouter Tool: User Prompt (LLaMA 4 Scout Persona)",
    policyRoutingOpenRouterUserPromptDesc: "This is an example of the user prompt structure sent to the LLaMA 4 Scout model via OpenRouter. The actual triage text is dynamically inserted.",
    policyRoutingOpenRouterUserPromptDesc_Llama4Scout: "This is an example of the user prompt structure sent to the LLaMA 4 Scout model via OpenRouter. The actual triage text is dynamically inserted.",
    adminPromptReferencesMenuItem: "Prompt References (Admin)",
    adminPromptReferencesPageTitle: "LLM Prompt References (Admin)",
    adminPromptReferencesPageDesc: "This page displays the exact prompt content used by the AI models for triage and policy-based routing.",

  },
  fr: {
    appName: "CAF MedRoute",
    loginTitle: "Connectez-vous à CAF MedRoute",
    loginDescription: "Entrez vos identifiants pour accéder à votre compte.",
    loginSuccessTitle: "Connexion réussie",
    loginSuccessDesc: "Bon retour!",
    loginErrorTitle: "Échec de la connexion",
    loginErrorDesc: "Veuillez vérifier vos identifiants et réessayer.",
    chatWithAI: "Assistant Clavardage",
    send: "Envoyer",
    typeYourMessage: "Écrivez votre message...",
    adminDashboard: "Tableau de bord admin",
    logout: "Déconnexion",
    user: "Utilisateur",
    assistant: "Assistant",
    system: "Système",
    signupTitle: "Créer un compte",
    signupDescription: "Créez un compte pour commencer.",
    displayNameLabel: "Nom d'affichage (Facultatif)",
    displayNamePlaceholder: "Votre Nom",
    signupSuccessTitle: "Compte créé",
    signupSuccessDesc: "Bienvenue! Vous êtes maintenant connecté.",
    signupErrorTitle: "Échec de l'inscription",
    signupErrorDesc: "Impossible de créer le compte. Veuillez réessayer.",
    emailLabel: "Courriel",
    passwordLabel: "Mot de passe",
    loginButton: "Connexion",
    signupButton: "S'inscrire",
    dontHaveAccount: "Pas de compte ?",
    alreadyHaveAccount: "Déjà un compte ?",
    triageResults: "Résultats du triage",
    triageResultsDescription: "En fonction de votre saisie, voici notre recommandation :",
    recommendation: "Recommandation",
    reasonLabel: "Raison",
    emergencyTitle: "URGENCE",
    emergencyMessage: "Il semble que vous ayez besoin d'une aide urgente. Veuillez contacter les services d'urgence (911) ou vous rendre immédiatement aux urgences les plus proches. Si vous êtes sur une base, suivez les protocoles d'urgence locaux.",
    chatInputFormLabel: "Formulaire de saisie de clavardage",
    attachFile: "Joindre un fichier",
    errorSavingSessionTitle: "Erreur d'enregistrement de la session",
    errorSavingSessionDesc: "Impossible d'enregistrer la session de triage.",
    aiErrorTitle: "Erreur IA",
    aiErrorDesc: "Impossible d'obtenir une réponse de l'assistant.",
    aiError: "Désolé, j'ai rencontré un problème. Veuillez réessayer.",
    loadingSessions: "Chargement des sessions de triage...",
    errorFetchingSessions: "Échec du chargement des sessions de triage. Veuillez réessayer.",
    errorTitle: "Erreur",
    noTriageSessions: "Aucune session de triage trouvée.",
    triageSessionsListDesc: "Une liste des sessions de triage récentes.",
    tableHeaderTimestamp: "Horodatage",
    tableHeaderUserID: "ID Utilisateur",
    tableHeaderRecommendation: "Recommandation",
    tableHeaderLanguage: "Langue",
    tableHeaderEmergency: "Urgence",
    tableHeaderActions: "Actions",
    viewDetailsButton: "Voir",
    triageSessionDetailsTitle: "Détails de la session de triage",
    sessionIdLabel: "ID de session",
    userIdLabel: "ID Utilisateur",
    timestampLabel: "Horodatage",
    languageLabel: "Langue",
    emergencyTriggeredLabel: "Alerte d'urgence",
    yes: "Oui",
    no: "Non",
    notAvailable: "Non disponible",
    notAvailableShort: "N/D",
    chatTranscript: "Transcription du clavardage",
    closeButton: "Fermer",
    loadingAdmin: "Chargement de la section admin...",
    adminAccessDenied: "Accès refusé. Vous n'êtes pas un administrateur.",
    adminNotAuthenticated: "Veuillez vous connecter pour accéder à cette section.",
    backToApp: "Retour à l'app",
    toggleLanguage: "Passer à {{lang}}",
    urgentActionRequired: "Action urgente requise :",
    erReferralInstruction: "Veuillez vous rendre immédiatement à la salle d'urgence la plus proche ou contacter les services d'urgence (911).",
    initialChatGreetingEn: "Hello! I'm your CAF MedRoute medical assistant. How can I help you today regarding your symptoms, injury, or occupational needs?",
    initialChatGreetingFr: "Bonjour ! Je suis votre assistant médical CAF MedRoute. Comment puis-je vous aider aujourd'hui concernant vos symptômes, blessures ou besoins professionnels ?",
    prepareForClinicButton: "Prép. pour clinique",
    prepareForClinicButtonShort: "Prép. Clinique",
    prepareForClinicModalTitle: "Préparer la session pour la planification clinique",
    prepareForClinicModalDesc: "Examinez les détails de la session formatés pour l'usage clinique. Vous pouvez copier ces informations pour faciliter la planification.",
    patientReferralTitle: "DEMANDE DE CONSULTATION PATIENT POUR PLANIFICATION CLINIQUE",
    dateGeneratedLabel: "Date de génération",
    recommendedAppointmentLabel: "Type de rendez-vous recommandé",
    aiTriageSummaryLabel: "Résumé du triage IA et motif",
    emergencyAlertDuringTriageLabel: "Alerte d'urgence pendant le triage",
    followEmergencyProtocols: "Suivre les protocoles d'urgence le cas échéant",
    forClinicUseTitle: "À L'USAGE DE LA CLINIQUE",
    patientNameLabel: "Nom du patient (si connu)",
    patientContactNumberLabel: "Numéro de contact du patient",
    unitSectionLabel: "Unité / Section (si applicable)",
    appointmentScheduledLabel: "Rendez-vous planifié",
    scheduledDateTimeLabel: "Date et heure prévues",
    clinicianAssignedLabel: "Clinicien assigné",
    confirmationSentLabel: "Confirmation envoyée au membre",
    clerkInitialsLabel: "Initiales du commis",
    notesLabel: "Notes",
    chatTranscriptSnippetTitle: "Extrait de la transcription du clavardage (derniers messages pour contexte)",
    copyToClipboardButton: "Copier dans le presse-papiers",
    copiedToClipboardMessage: "Copié dans le presse-papiers !",
    copyToClipboardFailed: "Échec de la copie.",
    noChatHistoryAvailable: "Aucun historique de clavardage disponible.",
    invalidDate: "Date invalide",
    schedulingSidebarTitle: "Prochaines étapes",
    appointmentTypeLabel: "Type de rendez-vous :",
    scheduleButton: "Planifier un rendez-vous",
    scheduleFunctionalityComingSoon: "La fonctionnalité de planification sera bientôt disponible !",
    scheduleRequestNotedTitle: "Demande de planification notée",
    scheduleRequestNotedDesc: "Le personnel de la clinique assurera un suivi en fonction de votre triage. Vous pouvez maintenant fermer ce panneau ou continuer à clavarder.",
    tableHeaderComplexity: "Complexité",
    tableHeaderReason: "Motif",
    referencesMenuItem: "Références",
    referencesPageTitle: "Références et Invites LLM",
    referencesPageDesc: "Cette page contient des informations sur les politiques, les directives et les invites exactes utilisées par l'assistant IA.",
    placeholderSectionTitle: "Contenu à venir",
    placeholderSectionContent: "Les références spécifiques et les documents sources qui éclairent les réponses de l'IA concernant les politiques médicales et les règles d'acheminement des FAC seront détaillés ici. Cela garantit la transparence et permet aux utilisateurs de comprendre la base des recommandations de l'IA.",
    placeholderCheckBack: "Veuillez revenir plus tard pour des informations à jour.",
    triageChatbotPromptTitle: "Invite Principale du Chatbot de Triage (LLaMA 4 Maverick)",
    triageChatbotPromptDesc: "Ceci est l'invite principale utilisée par le modèle IA pour le flux du chatbot de triage (via Genkit ai.definePrompt). Handlebars ({{...}}) est utilisé pour la création de modèles d'historique de clavardage et d'entrée utilisateur. L'IA adopte la personnalité LLaMA 4 Maverick.",
    triageChatbotPromptDesc_Llama4Maverick: "Ceci est l'invite principale utilisée par le modèle IA LLaMA 4 Maverick (via OpenRouter / Genkit ai.definePrompt) pour le flux du chatbot de triage. Handlebars ({{...}}) est utilisé pour la création de modèles d'historique de clavardage et d'entrée utilisateur.",
    policyRoutingPromptsTitle: "Invites d'Acheminement Basé sur les Politiques (Personnalité LLaMA 4 Scout)",
    policyRoutingPromptsTitle_Llama4Scout: "Invites d'Acheminement Basé sur les Politiques (LLaMA 4 Scout)",
    policyRoutingGenkitPromptLabel: "Invite de Flux Genkit (IA Principal)",
    policyRoutingGenkitPromptDesc: "Cette invite demande au modèle IA principal (via Genkit) d'utiliser l'outil \"getCaFRoutingRecommendation\" pour l'acheminement basé sur les politiques. L'outil utilise en interne une IA avec la personnalité LLaMA 4 Scout.",
    policyRoutingGenkitPromptDesc_Llama4Scout: "Cette invite demande au modèle IA principal (LLaMA 4 Maverick via Genkit) d'utiliser l'outil \"getCaFRoutingRecommendation\" pour l'acheminement basé sur les politiques. L'outil utilise en interne le modèle LLaMA 4 Scout via OpenRouter.",
    policyRoutingOpenRouterSystemPromptLabel: "Outil OpenRouter : Invite Système (Personnalité LLaMA 4 Scout)",
    policyRoutingOpenRouterSystemPromptDesc: "Ceci est l'invite système envoyée au modèle LLaMA 4 Scout via OpenRouter au sein de l'outil \"getCaFRoutingRecommendation\".",
    policyRoutingOpenRouterSystemPromptDesc_Llama4Scout: "Ceci est l'invite système envoyée au modèle LLaMA 4 Scout via OpenRouter au sein de l'outil \"getCaFRoutingRecommendation\".",
    policyRoutingOpenRouterUserPromptLabel: "Outil OpenRouter : Invite Utilisateur (Personnalité LLaMA 4 Scout)",
    policyRoutingOpenRouterUserPromptDesc: "Ceci est un exemple de la structure d'invite utilisateur envoyée au modèle LLaMA 4 Scout via OpenRouter. Le texte de triage réel est inséré dynamiquement.",
    policyRoutingOpenRouterUserPromptDesc_Llama4Scout: "Ceci est un exemple de la structure d'invite utilisateur envoyée au modèle LLaMA 4 Scout via OpenRouter. Le texte de triage réel est inséré dynamiquement.",
    adminPromptReferencesMenuItem: "Références d'Invite (Admin)",
    adminPromptReferencesPageTitle: "Références d'Invite LLM (Admin)",
    adminPromptReferencesPageDesc: "Cette page affiche le contenu exact des invites utilisées par les modèles IA pour le triage et l'acheminement basé sur les politiques.",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('caf-medroute-lang') as Language | null;
    if (storedLang && ['en', 'fr'].includes(storedLang)) {
      setLanguageState(storedLang);
    } else {
      if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language.split('-')[0] as Language;
        if (browserLang === 'fr') {
          setLanguageState('fr');
        } else {
          setLanguageState('en'); 
        }
      } else {
        setLanguageState('en'); 
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('caf-medroute-lang', lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language]?.[key] || translations['en']?.[key] || key;
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(params[paramKey]));
      });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
