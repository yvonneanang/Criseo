import { useState, useEffect } from "react";

// Translation keys and their values for different languages
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.inventory': 'Inventory',
    'nav.ai_assistant': 'AI Assistant', 
    'nav.organizations': 'Organizations',
    'nav.emergency_call': 'Emergency Call',

    // Home page
    'home.title': 'Criseo Crisis Resource Platform',
    'home.subtitle': 'Find essential resources during crisis situations',
    'home.search_placeholder': 'Search for resources, locations, or services...',
    'home.search_button': 'Search Resources',
    'home.emergency_button': 'Emergency Call',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
  },
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.inventory': 'Inventario',
    'nav.ai_assistant': 'Asistente IA',
    'nav.organizations': 'Organizaciones',
    'nav.emergency_call': 'Llamada de Emergencia',

    // Home page
    'home.title': 'Plataforma de Recursos de Crisis Criseo',
    'home.subtitle': 'Encuentra recursos esenciales durante situaciones de crisis',
    'home.search_placeholder': 'Buscar recursos, ubicaciones o servicios...',
    'home.search_button': 'Buscar Recursos',
    'home.emergency_button': 'Llamada de Emergencia',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.add': 'Agregar',
  },
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.inventory': 'Inventaire',
    'nav.ai_assistant': 'Assistant IA',
    'nav.organizations': 'Organisations',
    'nav.emergency_call': 'Appel d\'Urgence',

    // Home page
    'home.title': 'Plateforme de Ressources de Crise Criseo',
    'home.subtitle': 'Trouvez des ressources essentielles pendant les situations de crise',
    'home.search_placeholder': 'Rechercher des ressources, emplacements ou services...',
    'home.search_button': 'Rechercher des Ressources',
    'home.emergency_button': 'Appel d\'Urgence',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.inventory': 'المخزون',
    'nav.ai_assistant': 'المساعد الذكي',
    'nav.organizations': 'المنظمات',
    'nav.emergency_call': 'مكالمة طوارئ',

    // Home page
    'home.title': 'منصة موارد الأزمات Criseo',
    'home.subtitle': 'العثور على الموارد الأساسية أثناء حالات الأزمات',
    'home.search_placeholder': 'البحث عن الموارد أو المواقع أو الخدمات...',
    'home.search_button': 'البحث عن الموارد',
    'home.emergency_button': 'مكالمة طوارئ',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
  }
};

export function useLanguage() {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') || 'en';
    setCurrentLanguage(savedLanguage);

    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const t = (key: string): string => {
    const languageTranslations = translations[currentLanguage as keyof typeof translations];
    return languageTranslations?.[key as keyof typeof languageTranslations] || 
           translations.en[key as keyof typeof translations.en] || 
           key;
  };

  return { currentLanguage, t };
}