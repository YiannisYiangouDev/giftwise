export const en = {
  // Navigation
  nav_dashboard: 'Dashboard',
  nav_recipients: 'Recipients',
  nav_wishlists: 'Wishlists',
  nav_secret_santa: 'Secret Santa',
  nav_price_tracker: 'Price Tracker',
  nav_analytics: 'Analytics & Budget',
  nav_history: 'Exchange History',
  nav_calendar: 'Occasion Calendar',
  nav_savings: 'Gift Savings Pool',
  nav_my_profile: 'My Profile',
  nav_settings: 'Settings',
  nav_install_app: 'Install PWA App',

  // Dashboard & General
  welcome: 'Welcome back',
  giftwise_subtitle: 'Family gift tracker with wishlists, Secret Santa, group gifts & price alerts across Cyprus & Greece',
  total_recipients: 'Total Recipients',
  active_wishlists: 'Active Wishlists',
  tracked_items: 'Tracked Items',
  upcoming_birthdays: 'Upcoming Birthdays',

  // Actions & Buttons
  btn_add_recipient: 'Add Recipient',
  btn_new_wishlist: 'New Wishlist',
  btn_add_product: 'Add Product',
  btn_contribute: 'Contribute',
  btn_share: 'Share',
  btn_edit: 'Edit',
  btn_delete: 'Delete',
  btn_cancel: 'Cancel',
  btn_save: 'Save',
  btn_ai_ideas: 'AI Gift Ideas',
  btn_install_app: 'Install App',

  // Wishlist Statuses
  status_wanted: 'Wanted',
  status_claimed: 'Claimed',
  status_purchased: 'Purchased',
  status_claimed_by: 'Claimed by',
  status_purchased_by: 'Purchased by',

  // Relationships
  rel_mother: 'Mother',
  rel_father: 'Father',
  rel_sister: 'Sister',
  rel_brother: 'Brother',
  rel_spouse: 'Spouse/Partner',
  rel_child: 'Son/Daughter',
  rel_friend: 'Friend',
  rel_relative: 'Relative',

  // Secret Santa
  secret_santa_title: 'Secret Santa',
  secret_santa_subtitle: 'Anonymous family gift exchange',
  create_group: 'Create Group',
  draw_names: 'Draw Names',
  anonymous_qa: 'Anonymous Q&A',
  ask_question: 'Ask a Question',
  your_match: 'Your Match',

  // Settings & PWA
  settings_title: 'Settings',
  settings_subtitle: 'Notification preferences, language & PWA app status',
  language_label: 'Language / Γλώσσα',
  pwa_section_title: 'Progressive Web App (PWA)',
  pwa_installed: 'App Installed (Standalone Mode)',
  pwa_browser: 'Running in Web Browser',
  push_notifications: 'Push Notifications',
  email_alerts: 'Email Alerts',
  test_push: 'Send Test Push Notification',
  clear_cache: 'Clear Offline Cache & Refresh App',

  // Analytics & Budget
  analytics_title: 'Gift Budget & Analytics',
  analytics_subtitle: 'Track annual gift spending, recipient budgets & occasion breakdowns',
  annual_budget: 'Total Annual Budget',
  total_spent: 'Total Spent',
  remaining_budget: 'Remaining Budget',
  avg_per_recipient: 'Avg per Recipient',
  spending_by_occasion: 'Spending by Occasion',
  monthly_expenses: 'Monthly Expense Timeline',
  recipient_budgets: 'Recipient Target Budgets',
  budget_under: 'Under Budget',
  budget_target_met: 'On Target',
  budget_over: 'Over Budget',
  btn_set_budget: 'Set Target Budget',

  // History & Export
  history_title: 'Gift Exchange History',
  history_subtitle: 'Archive of all gifts given and received across previous years',
  lifetime_spent: 'Lifetime Gift Expenditure',
  total_gifts_given: 'Gifts Given',
  avg_gift_value: 'Avg Gift Value',
  all_years: 'All Years',
  all_recipients: 'All Recipients',
  export_pdf: 'Export PDF / Print',
  print_guide: 'Print Gift Guide',

  // Calendar & Name Days
  calendar_title: 'Occasion Calendar',
  calendar_subtitle: 'Birthdays, Name Days, Anniversaries & iCal Calendar Sync',
  namedays_title: 'Name Days (Εορτολόγιο)',
  ical_subscribe: 'Subscribe to iCal Feed',
  alert_lead_time: 'Push Alert Lead Time',

  // Savings Calculator
  savings_title: 'Gift Savings Calculator',
  savings_subtitle: 'Set aside monthly funds for Christmas, weddings & major celebrations',
  total_savings_pool: 'Total Savings Pool',
  monthly_target: 'Monthly Savings Target',
  add_savings_goal: 'New Savings Goal',
  add_deposit: 'Log Deposit',

  // Name Days Directory
  nd_directory_title: 'Greek & International Name Days Directory (Εορτολόγιο)',
  nd_directory_subtitle: 'Search and browse saint feast days to match with your loved ones',
  nd_search_placeholder: 'Search by name, Greek spelling, or date...',
  nd_tab_all: 'All Occasions',
  nd_tab_today: 'Today',
  nd_tab_matched: 'Matched Recipients',
  nd_month_all: 'All',
  nd_unassigned: 'Unassigned',
  nd_for: 'For',
  nd_no_results: 'No matching name day occasions found.',
  nd_showing: 'Showing',
  nd_to: 'to',
  nd_of: 'of',
  nd_entries: 'entries',
}

export type TranslationKeys = keyof typeof en
