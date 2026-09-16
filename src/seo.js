const brandKeywords = ['Alignaa', 'Alignaa Aligner', 'Dr. Praful', 'Praful Ozarkar'];

const introductionKeywords = ['Alignaa founder Praful Ozarkar', 'Alignaa introduction video', 'clinician-led clear aligners', 'hybrid orthodontic treatment', 'digital orthodontics', 'anterior crossbite treatment', 'Dr. Ganesh Shinde', 'Dr. Tanvi Bore', 'clear aligner patient experience'];
const germanIntroductionKeywords = ['Alignaa Gründer Praful Ozarkar', 'Alignaa Vorstellungsvideo', 'ärztlich begleitete Aligner-Behandlung', 'hybride Kieferorthopädie', 'digitale Kieferorthopädie', 'anteriorer Kreuzbiss', 'Dr. Ganesh Shinde', 'Dr. Tanvi Bore', 'Aligner Patientenerfahrung'];

const entries = {
  '/': ['Clear Aligners for Dental Professionals | Alignaa', 'Explore Alignaa clear aligner solutions for dentists and orthodontists, with digital treatment planning, 3D simulation, case studies and training.', ['clear aligners', 'clear aligner solutions', 'dental aligners', 'orthodontic aligners', 'aligners for dentists', 'aligners for orthodontists']],
  '/the-Alignaa-system/': ['Clear Aligner System & Treatment Planning | Alignaa', 'Discover the Alignaa clear aligner system, digital treatment planning, 3D treatment simulation and an online portal for dental professionals.', ['clear aligner system', 'digital treatment planning', '3D treatment simulation', 'clear aligner treatment', 'aligner case management']],
  '/free-webinar/': ['Free Clear Aligner Webinar for Dentists | Alignaa', 'Explore free Alignaa webinars for dental professionals and learn about the clear aligner workflow, treatment planning and getting started with cases.', ['clear aligner webinar', 'aligner training for dentists', 'orthodontic webinar', 'clear aligner certification']],
  '/case-studies/': ['Clear Aligner Case Studies | Alignaa', 'Explore Alignaa clear aligner case studies covering crowding, spacing, open bite, crossbite and misaligned teeth for dental professionals.', ['clear aligner case studies', 'teeth crowding', 'teeth spacing', 'open bite', 'crossbite', 'misaligned teeth']],
  '/contact-us/': ['Contact Alignaa | Clear Aligner Support', 'Contact Alignaa for clear aligner enquiries, practice support and help getting started with the Alignaa portal as a dental professional.', ['Alignaa contact', 'clear aligner support', 'dental practice support']],
  '/de/startseite/': ['Clear Aligner für Zahnärzte | Alignaa', 'Entdecken Sie Alignaa Aligner-Lösungen für Zahnärzte und Kieferorthopäden mit digitaler Behandlungsplanung, 3D-Simulation und Webinaren.', ['transparente Zahnschienen', 'Clear Aligner', 'Aligner für Zahnärzte', 'Aligner für Kieferorthopäden']],
  '/de/das-Alignaa-system/': ['Aligner-System & digitale Behandlungsplanung | Alignaa', 'Entdecken Sie das Alignaa Aligner-System mit digitaler Behandlungsplanung, 3D-Simulation und einem Online-Portal für Zahnarztpraxen.', ['Aligner-System', 'digitale Behandlungsplanung', '3D-Behandlungssimulation', 'Aligner-Behandlung']],
  '/de/gratis-webinar/': ['Gratis Aligner-Webinar für Zahnärzte | Alignaa', 'Lernen Sie das Alignaa-System in kostenlosen Webinaren für Zahnärzte kennen und erfahren Sie mehr über den Einstieg in die Aligner-Behandlung.', ['Aligner-Webinar', 'Aligner-Fortbildung', 'Webinar für Zahnärzte']],
  '/de/fallstudien/': ['Aligner-Fallstudien | Alignaa', 'Entdecken Sie Alignaa-Fallstudien zu Engstand, Zahnlücken, offenem Biss, Kreuzbiss und Zahnfehlstellungen für die zahnärztliche Praxis.', ['Aligner-Fallstudien', 'Engstand', 'Zahnlücken', 'offener Biss', 'Kreuzbiss', 'Zahnfehlstellungen']],
  '/de/kontakt/': ['Kontakt & Aligner-Support | Alignaa', 'Kontaktieren Sie Alignaa bei Fragen zum Aligner-System, zur Unterstützung Ihrer Zahnarztpraxis und zum Einstieg in das Alignaa-Portal.', ['Alignaa Kontakt', 'Aligner-Support', 'Zahnarztpraxis']],
  '/privacy-policy/': ['Privacy Policy | Alignaa', 'Read the Alignaa privacy policy for information about personal data, data processing and privacy rights.', ['Alignaa privacy policy']],
  '/legal-disclosure/': ['Legal Disclosure | Alignaa', 'Read the Alignaa legal disclosure, website responsibility and production information.', ['Alignaa legal disclosure']],
  '/de/datenschutz/': ['Datenschutzerklärung | Alignaa', 'Lesen Sie die Alignaa-Datenschutzerklärung mit Informationen zur Verarbeitung personenbezogener Daten und Ihren Rechten.', ['Alignaa Datenschutz']],
  '/de/impressum/': ['Impressum | Alignaa', 'Lesen Sie das Alignaa-Impressum mit Angaben zur Website-Verantwortung und zur Herstellung der Aligner.', ['Alignaa Impressum']],
};

export function getSeo(path) {
  const [title, defaultDescription, keywords] = entries[path] || entries['/'];
  const videoKeywords = path === '/' ? introductionKeywords : path === '/de/startseite/' ? germanIntroductionKeywords : [];
  const description = path === '/'
    ? 'Discover Alignaa clear aligners for dental professionals. Meet founder Praful Ozarkar and the clinical team, and explore their approach and patient experience.'
    : path === '/de/startseite/'
      ? 'Entdecken Sie Alignaa Aligner für Zahnärzte. Lernen Sie Gründer Praful Ozarkar, das Behandlungsteam und die Erfahrungen einer Patientin kennen.'
      : defaultDescription;
  const legal = /privacy-policy|legal-disclosure|datenschutz|impressum/.test(path);
  return { title, description, keywords: [...(legal ? ['Alignaa'] : brandKeywords), ...keywords, ...videoKeywords].join(', ') };
}

export function seoMeta(seo) {
  return [
    ['name', 'description', seo.description],
    ['name', 'keywords', seo.keywords],
    ['property', 'og:title', seo.title],
    ['property', 'og:description', seo.description],
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'Alignaa'],
    ['name', 'twitter:card', 'summary'],
    ['name', 'twitter:title', seo.title],
    ['name', 'twitter:description', seo.description],
  ];
}

export function updateSeo(path) {
  const seo = getSeo(path);
  document.title = seo.title;
  for (const [attribute, key, content] of seoMeta(seo)) {
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }
}
