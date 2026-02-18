const translations = {
    en: {
        register: "Register",
        dashboard: "Dashboard",
        title: "DocNotify",
        subtitle: "Quickly register your documents for notification.",
        fullName: "Full Name",
        phoneNumber: "Phone Number",
        docType: "Document Type",
        networkProvider: "Network Provider",
        selectDoc: "Select a document type",
        selectProvider: "Select provider",
        btnRegister: "Register Document",
        registrationSuccess: "Registration successful!",
        registrationFailed: "Registration failed. Please try again.",
        adminTitle: "Admin Dashboard",
        adminSubtitle: "Manage registrations and customize notifications.",
        total: "Total",
        pending: "Pending",
        ready: "Ready",
        serviceSettings: "Service Settings",
        gatewayId: "Android Gateway ID (Optional)",
        gatewayNote: "Leave empty to use SMS.to direct API. Provide an ID to use your Android SMS Gateway.",
        msgTemplate: "Message Template",
        msgNote: "Use [Name] and [DocType] as placeholders.",
        registrations: "Registrations",
        export: "Export",
        refresh: "Refresh",
        thName: "Name",
        thPhone: "Phone",
        thDoc: "Document",
        thStatus: "Status",
        thAction: "Action",
        notify: "Notify",
        sent: "Sent!",
        error: "Error",
        loading: "..."
    },
    fr: {
        register: "S'inscrire",
        dashboard: "Tableau de bord",
        title: "DocNotify",
        subtitle: "Enregistrez rapidement vos documents pour notification.",
        fullName: "Nom complet",
        phoneNumber: "Numéro de téléphone",
        docType: "Type de document",
        networkProvider: "Fournisseur de réseau",
        selectDoc: "Sélectionnez un type de document",
        selectProvider: "Sélectionnez un fournisseur",
        btnRegister: "Enregistrer le document",
        registrationSuccess: "Enregistrement réussi !",
        registrationFailed: "Échec de l'enregistrement. Veuillez réessayer.",
        adminTitle: "Tableau de bord Admin",
        adminSubtitle: "Gérez les inscriptions et personnalisez les notifications.",
        total: "Total",
        pending: "En attente",
        ready: "Prêt",
        serviceSettings: "Paramètres du service",
        gatewayId: "ID de la passerelle Android (Optionnel)",
        gatewayNote: "Laissez vide pour utiliser l'API directe SMS.to. Fournissez un ID pour utiliser votre passerelle SMS Android.",
        msgTemplate: "Modèle de message",
        msgNote: "Utilisez [Name] et [DocType] comme espaces réservés.",
        registrations: "Inscriptions",
        export: "Exporter",
        refresh: "Actualiser",
        thName: "Nom",
        thPhone: "Téléphone",
        thDoc: "Document",
        thStatus: "Statut",
        thAction: "Action",
        notify: "Notifier",
        sent: "Envoyé !",
        error: "Erreur",
        loading: "..."
    }
};

export const initI18n = () => {
    let currentLang = localStorage.getItem('lang') || 'en';
    let currentTheme = localStorage.getItem('theme') || 'dark';

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    };

    const applyLang = (lang) => {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        });
        const langBtn = document.getElementById('langToggle');
        if (langBtn) langBtn.textContent = lang.toUpperCase();
    };

    // Theme Toggle
    document.addEventListener('click', (e) => {
        if (e.target.id === 'themeToggle') {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(currentTheme);
        }
        if (e.target.id === 'langToggle') {
            currentLang = currentLang === 'en' ? 'fr' : 'en';
            applyLang(currentLang);
        }
    });

    applyTheme(currentTheme);
    applyLang(currentLang);

    return {
        t: (key) => translations[currentLang][key] || key,
        getLang: () => currentLang
    };
};
