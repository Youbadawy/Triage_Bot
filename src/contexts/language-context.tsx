
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
    chatWithAI: "Chat with AI Assistant",
    send: "Send",
    typeYourMessage: "Type your message...",
    adminDashboard: "Admin Dashboard",
    logout: "Logout",
    user: "User",
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
    triageResultsDescription: "Based on your symptoms, here is our recommendation:",
    recommendation: "Recommendation",
    reason: "Reason",
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
  },
  fr: {
    appName: "CAF MedRoute",
    loginTitle: "Connectez-vous à CAF MedRoute",
    loginDescription: "Entrez vos identifiants pour accéder à votre compte.",
    loginSuccessTitle: "Connexion réussie",
    loginSuccessDesc: "Bon retour!",
    loginErrorTitle: "Échec de la connexion",
    loginErrorDesc: "Veuillez vérifier vos identifiants et réessayer.",
    chatWithAI: "Discutez avec l'assistant IA",
    send: "Envoyer",
    typeYourMessage: "Écrivez votre message...",
    adminDashboard: "Tableau de bord",
    logout: "Déconnexion",
    user: "Utilisateur",
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
    triageResultsDescription: "En fonction de vos symptômes, voici notre recommandation :",
    recommendation: "Recommandation",
    reason: "Raison",
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
    emergencyTriggeredLabel: "Alerte d'urgence déclenchée",
    yes: "Oui",
    no: "Non",
    chatTranscript: "Transcription du clavardage",
    closeButton: "Fermer",
    loadingAdmin: "Chargement de la section admin...",
    adminAccessDenied: "Accès refusé. Vous n'êtes pas un administrateur.",
    adminNotAuthenticated: "Veuillez vous connecter pour accéder à cette section.",
    backToApp: "Retour à l'application",
    toggleLanguage: "Passer à {{lang}}",
    urgentActionRequired: "Action urgente requise :",
    erReferralInstruction: "Veuillez vous rendre immédiatement à la salle d'urgence la plus proche ou contacter les services d'urgence (911).",
    initialChatGreetingEn: "Hello! I'm your CAF MedRoute medical assistant. How can I help you today regarding your symptoms, injury, or occupational needs?",
    initialChatGreetingFr: "Bonjour ! Je suis votre assistant médical CAF MedRoute. Comment puis-je vous aider aujourd'hui concernant vos symptômes, blessures ou besoins professionnels ?",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('caf-medroute-lang') as Language | null;
    if (storedLang && ['en', 'fr'].includes(storedLang)) {
      setLanguageState(storedLang);
    } else {
      const browserLang = navigator.language.split('-')[0] as Language;
      if (browserLang === 'fr') {
        setLanguageState('fr');
      } else {
        setLanguageState('en'); // Default to English if browser language is not French
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('caf-medroute-lang', lang);
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

