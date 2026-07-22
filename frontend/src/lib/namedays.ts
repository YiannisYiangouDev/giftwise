/**
 * Greek & International Name Day Database for GiftWise
 * Maps recipient names to celebration dates (month-day, e.g. "01-07" for 7 Jan).
 */

export interface NameDayEntry {
  name: string
  greekName: string
  date: string // "MM-DD"
  description: string
}

export const GREEK_NAMEDAYS: NameDayEntry[] = [
  { name: 'Yiannis', greekName: 'Ιωάννης / Ιωάννα', date: '01-07', description: 'St. John the Baptist (Αγίου Ιωάννου Προδρόμου)' },
  { name: 'John', greekName: 'Ιωάννης', date: '01-07', description: 'St. John the Baptist (Αγίου Ιωάννου)' },
  { name: 'Ioannis', greekName: 'Ιωάννης', date: '01-07', description: 'St. John the Baptist (Αγίου Ιωάννου)' },
  { name: 'Vasilis', greekName: 'Βασίλειος / Βασιλική', date: '01-01', description: 'St. Basil (Αγίου Βασιλείου)' },
  { name: 'Bill', greekName: 'Βασίλειος', date: '01-01', description: 'St. Basil (Αγίου Βασιλείου)' },
  { name: 'Anthony', greekName: 'Αντώνιος / Αντωνία', date: '01-17', description: 'St. Anthony the Great (Αγίου Αντωνίου)' },
  { name: 'Antonis', greekName: 'Αντώνιος', date: '01-17', description: 'St. Anthony the Great (Αγίου Αντωνίου)' },
  { name: 'Athanasios', greekName: 'Αθανάσιος / Αθανασία', date: '01-18', description: 'St. Athanasius (Αγίου Αθανασίου)' },
  { name: 'Thanasis', greekName: 'Αθανάσιος', date: '01-18', description: 'St. Athanasius (Αγίου Αθανασίου)' },
  { name: 'Gregory', greekName: 'Γρηγόριος', date: '01-25', description: 'St. Gregory (Αγίου Γρηγορίου)' },
  { name: 'Haralambos', greekName: 'Χαράλαμπος / Χαρά', date: '02-10', description: 'St. Haralambos (Αγίου Χαραλάμπους)' },
  { name: 'Babis', greekName: 'Χαράλαμπος', date: '02-10', description: 'St. Haralambos (Αγίου Χαραλάμπους)' },
  { name: 'George', greekName: 'Γεώργιος / Γεωργία', date: '04-23', description: 'St. George (Αγίου Γεωργίου)' },
  { name: 'Yiorgos', greekName: 'Γεώργιος', date: '04-23', description: 'St. George (Αγίου Γεωργίου)' },
  { name: 'Giorgos', greekName: 'Γεώργιος', date: '04-23', description: 'St. George (Αγίου Γεωργίου)' },
  { name: 'Konstantinos', greekName: 'Κωνσταντίνος / Ελένη', date: '05-21', description: 'Sts. Constantine & Helen (Κωνσταντίνου & Ελένης)' },
  { name: 'Kostas', greekName: 'Κωνσταντίνος', date: '05-21', description: 'Sts. Constantine & Helen (Κωνσταντίνου & Ελένης)' },
  { name: 'Gus', greekName: 'Κωνσταντίνος', date: '05-21', description: 'Sts. Constantine & Helen (Κωνσταντίνου & Ελένης)' },
  { name: 'Eleni', greekName: 'Ελένη', date: '05-21', description: 'Sts. Constantine & Helen (Κωνσταντίνου & Ελένης)' },
  { name: 'Helen', greekName: 'Ελένη', date: '05-21', description: 'Sts. Constantine & Helen (Κωνσταντίνου & Ελένης)' },
  { name: 'Elena', greekName: 'Ελένη', date: '05-21', description: 'Sts. Constantine & Helen (Κωνσταντίνου & Ελένης)' },
  { name: 'Peter', greekName: 'Πέτρος / Παύλος', date: '06-29', description: 'Sts. Peter & Paul (Πέτρου & Παύλου)' },
  { name: 'Petros', greekName: 'Πέτρος', date: '06-29', description: 'Sts. Peter & Paul (Πέτρου & Παύλου)' },
  { name: 'Paul', greekName: 'Παύλος', date: '06-29', description: 'Sts. Peter & Paul (Πέτρου & Παύλου)' },
  { name: 'Pavlos', greekName: 'Παύλος', date: '06-29', description: 'Sts. Peter & Paul (Πέτρου & Παύλου)' },
  { name: 'Ilias', greekName: 'Ηλίας', date: '07-20', description: 'Prophet Elias (Προφήτη Ηλία)' },
  { name: 'Elias', greekName: 'Ηλίας', date: '07-20', description: 'Prophet Elias (Προφήτη Ηλία)' },
  { name: 'Christina', greekName: 'Χριστίνα', date: '07-24', description: 'St. Christina (Αγίας Χριστίνας)' },
  { name: 'Paraskevi', greekName: 'Παρασκευή', date: '07-26', description: 'St. Paraskevi (Αγίας Παρασκευής)' },
  { name: 'Voula', greekName: 'Παρασκευή', date: '07-26', description: 'St. Paraskevi (Αγίας Παρασκευής)' },
  { name: 'Panteleimon', greekName: 'Παντελεήμων', date: '07-27', description: 'St. Panteleimon (Αγίου Παντελεήμονος)' },
  { name: 'Maria', greekName: 'Μαρία / Παναγιώτης', date: '08-15', description: 'Dormition of the Virgin Mary (Κοίμηση της Θεοτόκου)' },
  { name: 'Panagiotis', greekName: 'Παναγιώτης', date: '08-15', description: 'Dormition of the Virgin Mary (Κοίμηση της Θεοτόκου)' },
  { name: 'Panos', greekName: 'Παναγιώτης', date: '08-15', description: 'Dormition of the Virgin Mary (Κοίμηση της Θεοτόκου)' },
  { name: 'Despina', greekName: 'Δέσποινα', date: '08-15', description: 'Dormition of the Virgin Mary (Κοίμηση της Θεοτόκου)' },
  { name: 'Alexander', greekName: 'Αλέξανδρος / Αλεξάνδρα', date: '08-30', description: 'St. Alexander (Αγίου Αλεξάνδρου)' },
  { name: 'Alex', greekName: 'Αλέξανδρος', date: '08-30', description: 'St. Alexander (Αγίου Αλεξάνδρου)' },
  { name: 'Alexandros', greekName: 'Αλέξανδρος', date: '08-30', description: 'St. Alexander (Αγίου Αλεξάνδρου)' },
  { name: 'Sophia', greekName: 'Σοφία / Πίστη / Ελπίδα / Αγάπη', date: '09-17', description: 'St. Sophia & daughters (Αγίας Σοφίας)' },
  { name: 'Sofia', greekName: 'Σοφία', date: '09-17', description: 'St. Sophia & daughters (Αγίας Σοφίας)' },
  { name: 'Dimitris', greekName: 'Δημήτριος / Δήμητρα', date: '10-26', description: 'St. Demetrius (Αγίου Δημητρίου)' },
  { name: 'Dimitrios', greekName: 'Δημήτριος', date: '10-26', description: 'St. Demetrius (Αγίου Δημητρίου)' },
  { name: 'Jim', greekName: 'Δημήτριος', date: '10-26', description: 'St. Demetrius (Αγίου Δημητρίου)' },
  { name: 'Michael', greekName: 'Μιχαήλ / Γαβριήλ / Άγγελος', date: '11-08', description: 'Archangels Michael & Gabriel (Παμμεγίστων Ταξιαρχών)' },
  { name: 'Michalis', greekName: 'Μιχαήλ', date: '11-08', description: 'Archangels Michael & Gabriel (Παμμεγίστων Ταξιαρχών)' },
  { name: 'Mike', greekName: 'Μιχαήλ', date: '11-08', description: 'Archangels Michael & Gabriel (Παμμεγίστων Ταξιαρχών)' },
  { name: 'Gabriel', greekName: 'Γαβριήλ', date: '11-08', description: 'Archangels Michael & Gabriel (Παμμεγίστων Ταξιαρχών)' },
  { name: 'Angelos', greekName: 'Άγγελος', date: '11-08', description: 'Archangels Michael & Gabriel (Παμμεγίστων Ταξιαρχών)' },
  { name: 'Katerina', greekName: 'Αικατερίνη', date: '11-25', description: 'St. Catherine (Αγίας Αικατερίνης)' },
  { name: 'Catherine', greekName: 'Αικατερίνη', date: '11-25', description: 'St. Catherine (Αγίας Αικατερίνης)' },
  { name: 'Kate', greekName: 'Αικατερίνη', date: '11-25', description: 'St. Catherine (Αγίας Αικατερίνης)' },
  { name: 'Stelios', greekName: 'Στυλιανός / Στυλιανή', date: '11-26', description: 'St. Stylianos (Αγίου Στυλιανού)' },
  { name: 'Stella', greekName: 'Στυλιανή', date: '11-26', description: 'St. Stylianos (Αγίου Στυλιανού)' },
  { name: 'Andrew', greekName: 'Ανδρέας / Ανδριάνα', date: '11-30', description: 'St. Andrew (Αγίου Ανδρέου)' },
  { name: 'Andreas', greekName: 'Ανδρέας', date: '11-30', description: 'St. Andrew (Αγίου Ανδρέου)' },
  { name: 'Barbara', greekName: 'Βαρβάρα', date: '12-04', description: 'St. Barbara (Αγίας Βαρβάρας)' },
  { name: 'Nikos', greekName: 'Νικόλαος / Νικολέτα', date: '12-06', description: 'St. Nicholas (Αγίου Νικολάου)' },
  { name: 'Nicholas', greekName: 'Νικόλαος', date: '12-06', description: 'St. Nicholas (Αγίου Νικολάου)' },
  { name: 'Nick', greekName: 'Νικόλαος', date: '12-06', description: 'St. Nicholas (Αγίου Νικολάου)' },
  { name: 'Spyridon', greekName: 'Σπυρίδων / Σπυριδούλα', date: '12-12', description: 'St. Spyridon (Αγίου Σπυρίδωνος)' },
  { name: 'Spiros', greekName: 'Σπυρίδων', date: '12-12', description: 'St. Spyridon (Αγίου Σπυρίδωνος)' },
  { name: 'Manolis', greekName: 'Εμμανουήλ / Εμμανουέλα', date: '12-25', description: 'Nativity of Christ (Χριστούγεννα)' },
  { name: 'Emmanuel', greekName: 'Εμμανουήλ', date: '12-25', description: 'Nativity of Christ (Χριστούγεννα)' },
  { name: 'Stefanos', greekName: 'Στέφανος / Στεφανία', date: '12-27', description: 'St. Stephen (Αγίου Στεφάνου)' },
  { name: 'Stephen', greekName: 'Στέφανος', date: '12-27', description: 'St. Stephen (Αγίου Στεφάνου)' },
]

export function matchNameDay(recipientName: string): NameDayEntry | null {
  if (!recipientName) return null
  const clean = recipientName.trim().toLowerCase()
  
  return GREEK_NAMEDAYS.find(entry => {
    const nameMatch = clean.includes(entry.name.toLowerCase()) || entry.name.toLowerCase().includes(clean)
    const greekMatch = clean.includes(entry.greekName.toLowerCase()) || entry.greekName.toLowerCase().includes(clean)
    return nameMatch || greekMatch
  }) || null
}
