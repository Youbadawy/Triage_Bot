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
    chatWithAI: "Chat with AI Assistant",
    send: "Send",
    typeYourMessage: "Type your message...",
    adminDashboard: "Admin Dashboard",
    logout: "Logout",
    signupTitle: "Create Account",
    emailLabel: "Email",
    passwordLabel: "Password",
    loginButton: "Login",
    signupButton: "Sign Up",
    dontHaveAccount: "Don't have an account? Sign Up",
    alreadyHaveAccount: "Already have an account? Login",
    triageResults: "Triage Results",
    recommendation: "Recommendation",
    reason: "Reason",
    emergencyTitle: "EMERGENCY",
    emergencyMessage: "It seems you might need urgent help. Please contact emergency services (911) or proceed to the nearest emergency room immediately. If you are on a base, follow local emergency protocols.",
  },
  fr: {
    appName: "CAF MedRoute",
    loginTitle: "Connectez-vous à CAF MedRoute",
    chatWithAI: "Discutez avec l'assistant IA",
    send: "Envoyer",
    typeYourMessage: "Écrivez votre message...",
    adminDashboard: "Tableau de bord administrateur",
    logout: "Déconnexion",
    signupTitle: "Créer un compte",
    emailLabel: "Courriel",
    passwordLabel: "Mot de passe",
    loginButton: "Connexion",
    signupButton: "S'inscrire",
    dontHaveAccount: "Pas de compte ? S'inscrire",
    alreadyHaveAccount: "Déjà un compte ? Se connecter",
    triageResults: "Résultats du triage",
    recommendation: "Recommandation",
    reason: "Raison",
    emergencyTitle: "URGENCE",
    emergencyMessage: "Il semble que vous ayez besoin d'une aide urgente. Veuillez contacter les services d'urgence (911) ou vous rendre immédiatement aux urgences les plus proches. Si vous êtes sur une base, suivez les protocoles d'urgence locaux.",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // بسيط: حاول اكتشاف لغة المتصفح أو استخدم لغة محفوظة
    const browserLang = navigator.language.split('-')[0] as Language;
    if (browserLang === 'fr') {
      setLanguageState('fr');
    }
    // يمكن أيضًا تحميل التفضيل من localStorage
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // يمكن أيضًا حفظ التفضيل في localStorage
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations['en'][key] || key;
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{{${paramKey}}}`, String(params[paramKey]));
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
