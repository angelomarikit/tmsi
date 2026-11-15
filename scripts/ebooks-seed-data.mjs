/** 17 client PDFs — matches src/data/ebooks.ts */
const base = 'TMSI-LUMINARIAN ACADEMY OF PHILOSOPHICAL STUDIES'

export const ebookSeedRows = [
  { legacy_slug: 'finger-moon', title: 'The Finger and the Moon', category: 'philosophical', pdf_path: `${base}/1-DOWNLOADABLE FREE EBOOKS FOR THE WEBSITE/BOOK  FINGER AND THE MOON.pdf`, sort_order: 1 },
  { legacy_slug: 'acupuncture', title: 'Book on Acupuncture', category: 'holistic', pdf_path: `${base}/1-DOWNLOADABLE FREE EBOOKS FOR THE WEBSITE/BOOK ON ACUPUNCTURE.pdf`, sort_order: 2 },
  { legacy_slug: 'whisper', title: 'Whisper (Book Project)', category: 'philosophical', pdf_path: `${base}/1-DOWNLOADABLE FREE EBOOKS FOR THE WEBSITE/BOOK PROJECT - WHISPER.pdf`, sort_order: 3 },
  { legacy_slug: 'daily-spark', title: 'Daily Spark', category: 'philosophical', pdf_path: `${base}/1-DOWNLOADABLE FREE EBOOKS FOR THE WEBSITE/DAILY SPARK.pdf`, sort_order: 4 },
  { legacy_slug: 'innertech', title: 'The Inner Technology', category: 'metaphysical', pdf_path: `${base}/1-DOWNLOADABLE FREE EBOOKS FOR THE WEBSITE/INNERTECH BOOK.pdf`, sort_order: 5 },
  { legacy_slug: 'maguindana', title: 'Maguindaia (Edited)', category: 'philosophical', pdf_path: `${base}/1-DOWNLOADABLE FREE EBOOKS FOR THE WEBSITE/MAGUINDAIA EDITED.pdf`, sort_order: 6 },
  { legacy_slug: 'luminar-mantra', title: 'The Luminar Mantra', category: 'transcendental', pdf_path: `${base}/2-DOWNLOADABLE FREE EBOOKS/THE LUMINAR MANTRA.pdf`, sort_order: 7 },
  { legacy_slug: 'soul-beyond-time', title: 'The Soul Beyond Time', category: 'metaphysical', pdf_path: `${base}/2-DOWNLOADABLE FREE EBOOKS/THE SOUL BEYOND TIME.pdf`, sort_order: 8 },
  { legacy_slug: 'vitalogist-ethics', title: 'Vitalogist Manual Ethics', category: 'holistic', pdf_path: `${base}/2-DOWNLOADABLE FREE EBOOKS/VITALOGIST MANUAL ETHICS.pdf`, sort_order: 9 },
  { legacy_slug: 'vitalogists-compendium', title: 'Vitalogists Compendium (Complete)', category: 'holistic', pdf_path: `${base}/2-DOWNLOADABLE FREE EBOOKS/VITALOGISTS COMPENDIUM COMPLETE.pdf`, sort_order: 10 },
  { legacy_slug: 'vitamins-minerals', title: 'Vitamins and Minerals', category: 'holistic', pdf_path: `${base}/2-DOWNLOADABLE FREE EBOOKS/VITAMINS AND MINERALS BOOK.pdf`, sort_order: 11 },
  { legacy_slug: 'herbal-desk', title: 'Herbal Desk Reference', category: 'holistic', pdf_path: `${base}/3-DOWNLOADABLE FREE EBOOKS/HERBAL DESK REFERENCE BOOK.pdf`, sort_order: 12 },
  { legacy_slug: 'herbal-formulary', title: 'Herbal Formulary', category: 'holistic', pdf_path: `${base}/3-DOWNLOADABLE FREE EBOOKS/HERBAL FORMULARY.pdf`, sort_order: 13 },
  { legacy_slug: 'meditation', title: 'Meditation', category: 'transcendental', pdf_path: `${base}/3-DOWNLOADABLE FREE EBOOKS/MEDITATION BOOK.pdf`, sort_order: 14 },
  { legacy_slug: 'metaphysical-science', title: 'Introduction to Metaphysical Science', category: 'metaphysical', pdf_path: `${base}/3-DOWNLOADABLE FREE EBOOKS/METAPHYSICAL SCIENCE BOOK.pdf`, sort_order: 15 },
  { legacy_slug: 'criminals-compassion', title: 'Criminals of Compassion', category: 'philosophical', pdf_path: `${base}/4-DOWNLOADABLE FREE EBOOKS/CRIMINALS OF COMPASSION.pdf`, sort_order: 16 },
  { legacy_slug: 'transmigration', title: 'Karma, Reincarnation and Transmigration', category: 'metaphysical', pdf_path: `${base}/4-DOWNLOADABLE FREE EBOOKS/TRANSMIGRATION-REINCARNATION BOOK.pdf`, sort_order: 17 },
].map((row) => ({
  ...row,
  publication_status: 'under_review',
  rights_confirmed: false,
  cover_path: null,
}))