/**
 * NNLOMNE Notify — Bilingual translations (FR first, EN fallback)
 * Usage: const { t } = useTranslation(); t('key')
 */

export type Lang = "fr" | "en";

export const translations = {
    // ─── Auth / Login ────────────────────────────────────────────────
    login_title: { fr: "NNLOMNE Notify", en: "NNLOMNE Notify" },
    login_subtitle: { fr: "Notifications SMS pour services administratifs", en: "SMS notifications for administrative services" },
    login_email: { fr: "Adresse e-mail", en: "Email address" },
    login_password: { fr: "Mot de passe", en: "Password" },
    login_btn: { fr: "Se connecter", en: "Sign in" },
    login_loading: { fr: "Connexion...", en: "Signing in..." },
    login_error: { fr: "Identifiants invalides. Utilisez admin@nnlomne.gov / password pour les tests.", en: "Invalid credentials. Use admin@nnlomne.gov / password for testing." },
    login_error_firebase: { fr: "Identifiants invalides. Vérifiez votre e-mail et mot de passe.", en: "Invalid credentials. Check your email and password." },
    login_secure: { fr: "Accès réservé à l'administration", en: "Admin access only" },
    login_demo_hint: { fr: "Mode démo : admin@nnlomne.gov — mot de passe : password", en: "Demo mode: admin@nnlomne.gov — password: password" },
    login_rights: { fr: "© 2026 Services Administratifs NNLOMNE.", en: "© 2026 NNLOMNE Administrative Services." },

    // ─── Navigation ──────────────────────────────────────────────────
    nav_dashboard: { fr: "Accueil", en: "Home" },
    nav_notify: { fr: "Envoyer", en: "Notify" },
    nav_history: { fr: "Historique", en: "History" },
    nav_contacts: { fr: "Contacts", en: "Contacts" },
    nav_settings: { fr: "Réglages", en: "Settings" },
    nav_admin: { fr: "Administrateur", en: "Administrator" },
    nav_logout: { fr: "Déconnexion", en: "Log out" },
    nav_brand_sub: { fr: "Notifications SMS", en: "SMS Notifications" },

    // ─── Dashboard ───────────────────────────────────────────────────
    dash_title: { fr: "Bonjour 👋", en: "Hello 👋" },
    dash_subtitle: { fr: "Voici l'activité de vos notifications", en: "Here is your notification activity" },
    dash_contacts: { fr: "Contacts", en: "Contacts" },
    dash_sent_today: { fr: "Envoyés aujourd'hui", en: "Sent today" },
    dash_total_sent: { fr: "Total envoyés", en: "Total sent" },
    dash_success_rate: { fr: "Taux de succès", en: "Success rate" },
    dash_quick_actions: { fr: "Actions rapides", en: "Quick actions" },
    dash_send_notif: { fr: "Envoyer une notification", en: "Send a notification" },
    dash_send_desc: { fr: "Un message personnalisé à tous vos contacts", en: "One personalized message to all your contacts" },
    dash_view_history: { fr: "Voir l'historique", en: "View history" },
    dash_recent: { fr: "Activité récente", en: "Recent activity" },
    dash_empty: { fr: "Aucune notification envoyée pour l'instant", en: "No notifications sent yet" },

    // ─── Notify (compose) ────────────────────────────────────────────
    notif_title: { fr: "Envoyer un SMS", en: "Send an SMS" },
    notif_subtitle: { fr: "Un seul message, personnalisé avec le nom de chacun", en: "One message, personalized with each person's name" },
    notif_step_recipients: { fr: "Destinataires", en: "Recipients" },
    notif_step_message: { fr: "Message", en: "Message" },
    notif_paste_label: { fr: "Collez votre liste", en: "Paste your list" },
    notif_paste_placeholder: {
        fr: "Jean Dupont; 691234567\nAmina Bello, 678555102\nPaul Etoundi | 699876543",
        en: "Jean Dupont; 691234567\nAmina Bello, 678555102\nPaul Etoundi | 699876543",
    },
    notif_paste_hint: { fr: "Une personne par ligne : Nom + numéro séparés par ; ou ,", en: "One person per line: Name + number separated by ; or ," },
    notif_valid_count: { fr: "destinataires valides", en: "valid recipients" },
    notif_invalid_count: { fr: "lignes invalides", en: "invalid lines" },
    notif_add_name: { fr: "Nom complet", en: "Full name" },
    notif_add_phone: { fr: "Numéro (69xxxxxxx)", en: "Number (69xxxxxxx)" },
    notif_add_btn: { fr: "Ajouter", en: "Add" },
    notif_load_contacts: { fr: "Charger mes contacts", en: "Load my contacts" },
    notif_clear: { fr: "Vider", en: "Clear" },
    notif_invalid_line: { fr: "Ligne {n} : numéro manquant ou invalide", en: "Line {n}: missing or invalid number" },
    notif_message_label: { fr: "Votre message", en: "Your message" },
    notif_message_placeholder: { fr: "Ex. Bonjour {name}, votre document est disponible. Merci de venir le retirer.", en: "E.g. Hello {name}, your document is ready. Please come and collect it." },
    notif_insert_name: { fr: "Insérer {name}", en: "Insert {name}" },
    notif_variable_hint: { fr: "{name} sera remplacé par le nom de chaque destinataire", en: "{name} is replaced by each recipient's name" },
    notif_chars: { fr: "caractères", en: "characters" },
    notif_segments: { fr: "segment(s)", en: "segment(s)" },
    notif_preview: { fr: "Aperçu du message nettoyé", en: "Sanitized message preview" },
    notif_preview_sub: { fr: "Aucun caractère spécial : accents, emojis et symboles supprimés", en: "No special characters: accents, emojis and symbols removed" },
    notif_empty_recipients: { fr: "Ajoutez au moins un destinataire valide", en: "Add at least one valid recipient" },
    notif_send_btn: { fr: "Envoyer", en: "Send" },
    notif_send_to: { fr: "Envoyer à {n} destinataire(s)", en: "Send to {n} recipient(s)" },
    notif_sending: { fr: "Envoi en cours...", en: "Sending..." },
    notif_confirm_title: { fr: "Confirmer l'envoi ?", en: "Confirm sending?" },
    notif_confirm_body: { fr: "{n} SMS ({seg} segment(s)) vont être envoyés via MboaSMS. Cette action est irréversible.", en: "{n} SMS ({seg} segment(s)) will be sent via MboaSMS. This action cannot be undone." },
    notif_confirm_cancel: { fr: "Annuler", en: "Cancel" },
    notif_confirm_send: { fr: "Envoyer maintenant", en: "Send now" },
    notif_result_title: { fr: "Résultat de l'envoi", en: "Send result" },
    notif_result_sent: { fr: "Envoyés", en: "Sent" },
    notif_result_failed: { fr: "Échoués", en: "Failed" },
    notif_result_details: { fr: "Détails des échecs", en: "Failure details" },
    notif_new_message: { fr: "Nouveau message", en: "New message" },
    notif_simulate_badge: { fr: "Mode simulation (aucun SMS réel)", en: "Simulation mode (no real SMS)" },
    notif_contacts_imported: { fr: "destinataire(s) importé(s) depuis vos contacts", en: "recipient(s) imported from your contacts" },
    notif_contacts_others: { fr: "{n} autres", en: "{n} more" },
    notif_contacts_remove: { fr: "Retirer {name} de la liste", en: "Remove {name} from the list" },

    // ─── History ─────────────────────────────────────────────────────
    hist_title: { fr: "Historique SMS", en: "SMS History" },
    hist_subtitle: { fr: "Toutes les notifications envoyées", en: "All sent notifications" },
    hist_search: { fr: "Rechercher un nom ou numéro...", en: "Search a name or number..." },
    hist_filter_all: { fr: "Tous", en: "All" },
    hist_filter_sent: { fr: "Envoyés", en: "Sent" },
    hist_filter_failed: { fr: "Échoués", en: "Failed" },
    hist_export: { fr: "Exporter CSV", en: "Export CSV" },
    hist_empty: { fr: "Aucun SMS envoyé", en: "No SMS sent" },
    hist_empty_sub: { fr: "Vos notifications apparaîtront ici", en: "Your notifications will appear here" },
    hist_sent: { fr: "Envoyé", en: "Sent" },
    hist_failed: { fr: "Échoué", en: "Failed" },

    // ─── Contacts (records) ──────────────────────────────────────────
    contacts_title: { fr: "Contacts", en: "Contacts" },
    contacts_subtitle: { fr: "Vos destinataires enregistrés", en: "Your saved recipients" },
    contacts_search: { fr: "Rechercher...", en: "Search..." },
    contacts_add_title: { fr: "Ajouter un contact", en: "Add a contact" },
    contacts_name: { fr: "Nom complet", en: "Full name" },
    contacts_phone: { fr: "Numéro de téléphone", en: "Phone number" },
    contacts_add_btn: { fr: "Ajouter", en: "Add" },
    contacts_empty: { fr: "Aucun contact enregistré", en: "No saved contacts" },
    contacts_delete_confirm: { fr: "Supprimer ce contact ?", en: "Delete this contact?" },
    contacts_delete_selected: { fr: "Supprimer", en: "Delete" },
    contacts_delete_many_confirm: { fr: "Supprimer {n} contact(s) ? Cette action est irréversible.", en: "Delete {n} contact(s)? This action cannot be undone." },
    contacts_network: { fr: "Réseau", en: "Network" },
    contacts_select_all: { fr: "Tout sélectionner", en: "Select all" },
    contacts_select_none: { fr: "Tout désélectionner", en: "Clear selection" },
    contacts_selected: { fr: "sélectionné(s)", en: "selected" },
    contacts_notify: { fr: "Notifier", en: "Notify" },
    contacts_notify_hint: { fr: "Envoie la sélection vers la composition du message", en: "Sends the selection to the message composer" },
    contacts_export: { fr: "Exporter CSV", en: "Export CSV" },

    // ─── Settings ────────────────────────────────────────────────────
    settings_title: { fr: "Réglages", en: "Settings" },
    settings_subtitle: { fr: "Configuration de l'application", en: "Application configuration" },
    settings_institution: { fr: "Institution", en: "Institution" },
    settings_institution_name: { fr: "Nom de l'institution", en: "Institution name" },
    settings_sender: { fr: "Identifiant expéditeur (Sender ID)", en: "Sender ID" },
    settings_mode: { fr: "Mode de données", en: "Data mode" },
    settings_mode_local: { fr: "Démo locale — données stockées dans ce navigateur", en: "Local demo — data stored in this browser" },
    settings_mode_firebase: { fr: "Firebase — données synchronisées dans Firestore", en: "Firebase — data synced to Firestore" },
    settings_simulate: { fr: "Mode simulation", en: "Simulation mode" },
    settings_simulate_desc: { fr: "Marque les SMS comme envoyés sans contacter MboaSMS (aucun coût)", en: "Marks SMS as sent without contacting MboaSMS (no cost)" },
    settings_language: { fr: "Langue de l'interface", en: "Interface language" },
    settings_danger: { fr: "Zone dangereuse", en: "Danger zone" },
    settings_clear: { fr: "Effacer les données locales", en: "Clear local data" },
    settings_clear_desc: { fr: "Supprime les contacts et l'historique de ce navigateur", en: "Deletes contacts and history from this browser" },
    settings_clear_confirm: { fr: "Effacer définitivement toutes les données locales ?", en: "Permanently delete all local data?" },
    settings_saved: { fr: "Enregistré ✓", en: "Saved ✓" },
    settings_save: { fr: "Enregistrer", en: "Save" },

    // ─── Common ──────────────────────────────────────────────────────
    common_cancel: { fr: "Annuler", en: "Cancel" },
    common_delete: { fr: "Supprimer", en: "Delete" },
};

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
    return translations[key]?.[lang] ?? translations[key]?.["fr"] ?? key;
}
