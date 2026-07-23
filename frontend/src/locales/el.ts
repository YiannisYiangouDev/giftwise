import type { TranslationKeys } from './en'

export const el: Record<TranslationKeys, string> = {
  // Navigation
  nav_dashboard: 'Πίνακας Ελέγχου',
  nav_recipients: 'Παραλήπτες',
  nav_wishlists: 'Λίστες Δώρων',
  nav_secret_santa: 'Secret Santa',
  nav_price_tracker: 'Παρακολούθηση Τιμών',
  nav_analytics: 'Αναλυτικά & Προϋπολογισμός',
  nav_history: 'Ιστορικό Δώρων',
  nav_calendar: 'Ημερολόγιο Περιστάσεων',
  nav_savings: 'Κουμπαράς Δώρων',
  nav_my_profile: 'Το Προφίλ μου',
  nav_settings: 'Ρυθμίσεις',
  nav_install_app: 'Εγκατάσταση Εφαρμογής',

  // Dashboard & General
  welcome: 'Καλώς ήρθατε',
  giftwise_subtitle: 'Οικογενειακή εφαρμογή δώρων με λίστες επιθυμιών, Secret Santa, ομαδικά δώρα & ειδοποιήσεις τιμών',
  total_recipients: 'Σύνολο Παραληπτών',
  active_wishlists: 'Ενεργές Λίστες',
  tracked_items: 'Παρακολουθούμενα Προϊόντα',
  upcoming_birthdays: 'Προσεχή Γενέθλια',

  // Actions & Buttons
  btn_add_recipient: 'Προσθήκη Παραλήπτη',
  btn_new_wishlist: 'Νέα Λίστα',
  btn_add_product: 'Προσθήκη Προϊόντος',
  btn_contribute: 'Συνεισφορά',
  btn_share: 'Κοινοποίηση',
  btn_edit: 'Επεξεργασία',
  btn_delete: 'Διαγραφή',
  btn_cancel: 'Ακύρωση',
  btn_save: 'Αποθήκευση',
  btn_ai_ideas: 'Ιδέες Δώρων AI',
  btn_install_app: 'Εγκατάσταση App',

  // Wishlist Statuses
  status_wanted: 'Ζητείται',
  status_claimed: 'Κρατήθηκε',
  status_purchased: 'Αγοράστηκε',
  status_claimed_by: 'Κρατήθηκε από',
  status_purchased_by: 'Αγοράστηκε από',

  // Relationships
  rel_mother: 'Μητέρα',
  rel_father: 'Πατέρας',
  rel_sister: 'Αδελφή',
  rel_brother: 'Αδελφός',
  rel_spouse: 'Σύζυγος/Σύντροφος',
  rel_child: 'Γιος/Κόρη',
  rel_friend: 'Φίλος/η',
  rel_relative: 'Συγγενής',

  // Secret Santa
  secret_santa_title: 'Secret Santa',
  secret_santa_subtitle: 'Ανώνυμη ανταλλαγή οικογενειακών δώρων',
  create_group: 'Δημιουργία Ομάδας',
  draw_names: 'Κλήρωση Ονομάτων',
  anonymous_qa: 'Ανώνυμες Ερωτήσεις',
  ask_question: 'Κάντε μια Ερώτηση',
  your_match: 'Το Ταίρι σας',

  // Settings & PWA
  settings_title: 'Ρυθμίσεις',
  settings_subtitle: 'Προτιμήσεις ειδοποιήσεων, γλώσσα & κατάσταση PWA',
  language_label: 'Γλώσσα / Language',
  pwa_section_title: 'Προοδευτική Εφαρμογή Ιστού (PWA)',
  pwa_installed: 'Εφαρμογή Εγκατεστημένη (Standalone)',
  pwa_browser: 'Λειτουργία σε Browser',
  push_notifications: 'Ειδοποιήσεις Push',
  email_alerts: 'Ειδοποιήσεις Email',
  test_push: 'Αποστολή Δοκιμαστικής Ειδοποίησης',
  clear_cache: 'Καθαρισμός Cache & Ανανέωση',

  // Analytics & Budget
  analytics_title: 'Προϋπολογισμός & Στατιστικά',
  analytics_subtitle: 'Παρακολούθηση ετήσιων δαπανών, προϋπολογισμών & αναλύσεων ανά περιστάσεις',
  annual_budget: 'Συνολικός Ετήσιος Προϋπολογισμός',
  total_spent: 'Συνολικά Έξοδα',
  remaining_budget: 'Υπόλοιπο Προϋπολογισμού',
  avg_per_recipient: 'Μ.Ο. ανά Παραλήπτη',
  spending_by_occasion: 'Δαπάνες ανά Περίσταση',
  monthly_expenses: 'Μηνιαία Χρονική Εξέλιξη',
  recipient_budgets: 'Προϋπολογισμός ανά Παραλήπτη',
  budget_under: 'Εντός Προϋπολογισμού',
  budget_target_met: 'Στον Στόχο',
  budget_over: 'Εκτός Προϋπολογισμού',
  btn_set_budget: 'Ορισμός Στόχου',

  // History & Export
  history_title: 'Ιστορικό Ανταλλαγής Δώρων',
  history_subtitle: 'Αρχείο όλων των δώρων που προσφέρθηκαν και παραλήφθηκαν ανά έτος',
  lifetime_spent: 'Συνολική Δαπάνη Δώρων',
  total_gifts_given: 'Δώρα που Προσφέρθηκαν',
  avg_gift_value: 'Μέση Αξία Δώρου',
  all_years: 'Όλα τα Έτη',
  all_recipients: 'Όλοι οι Παραλήπτες',
  export_pdf: 'Εξαγωγή PDF / Εκτύπωση',
  print_guide: 'Εκτύπωση Οδηγού Δώρων',

  // Calendar & Name Days
  calendar_title: 'Ημερολόγιο Περιστάσεων',
  calendar_subtitle: 'Γενέθλια, Εορτολόγιο, Επέτειοι & Συγχρονισμός iCal',
  namedays_title: 'Εορτολόγιο (Ονομαστικές Εορτές)',
  ical_subscribe: 'Εγγραφή στο iCal Feed',
  alert_lead_time: 'Χρόνος Προειδοποίησης Push',

  // Savings Calculator
  savings_title: 'Κουμπαράς & Υπολογιστής Αποταμίευσης',
  savings_subtitle: 'Μηνιαία αποταμίευση για Χριστούγεννα, γάμους & μεγάλες γιορτές',
  total_savings_pool: 'Συνολικό Ταμείο Αποταμίευσης',
  monthly_target: 'Μηνιαίος Στόχος Αποταμίευσης',
  add_savings_goal: 'Νέος Στόχος Αποταμίευσης',
  add_deposit: 'Κατάθεση Στον Κουμπαρά',

  // Name Days Directory
  nd_directory_title: 'Ευρετήριο Ελληνικών & Διεθνών Ονομαστικών Εορτών',
  nd_directory_subtitle: 'Αναζητήστε και δείτε τις γιορτές των αγίων για να τις αντιστοιχίσετε με τους αγαπημένους σας',
  nd_search_placeholder: 'Αναζήτηση με όνομα, ελληνική γραφή ή ημερομηνία...',
  nd_tab_all: 'Όλες οι Γιορτές',
  nd_tab_today: 'Σήμερα',
  nd_tab_matched: 'Αντιστοιχισμένοι Αποδέκτες',
  nd_month_all: 'Όλοι',
  nd_unassigned: 'Μη ανατεθειμένο',
  nd_for: 'Για',
  nd_no_results: 'Δεν βρέθηκαν αντίστοιχες ονομαστικές γιορτές.',
  nd_showing: 'Εμφάνιση',
  nd_to: 'έως',
  nd_of: 'από',
  nd_entries: 'εγγραφές',
}
