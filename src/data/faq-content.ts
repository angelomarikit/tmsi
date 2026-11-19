export type FaqItem = {
  id: number
  question: string
  answer: string
  bullets?: string[]
}

export type FaqSection = {
  id: string
  title: string
  items: FaqItem[]
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'about',
    title: 'About the Academy',
    items: [
      {
        id: 1,
        question: 'What is TMSI–Luminarian Academy of Philosophical Studies?',
        answer:
          'TMSI-LAPS is the educational arm of the Transcendental Metaphysical Science Institute – Philippines (TMSI-PH), offering specialized programs in metaphysical science, Luminarian Philosophy, Transcendentalism, Vitalogy, and related philosophical and complementary disciplines. Our educational approach emphasizes lifelong learning, self-directed study, philosophical understanding, consciousness development, and personal transformation.',
      },
      {
        id: 2,
        question: 'What is the Lifelong Education Advancement Program (LEAP)?',
        answer:
          'LEAP is an educational pathway designed for adult learners, professionals, practitioners, independent researchers, and individuals seeking advanced philosophical and metaphysical knowledge. It provides flexible learning opportunities through digital correspondence and independent home study.',
      },
      {
        id: 3,
        question: 'Is TMSI-LAPS a government-recognized university?',
        answer:
          'TMSI-LAPS operates as a private, institutionally administered educational academy specializing in metaphysical and philosophical studies. Its programs are not represented as government-accredited academic degrees under the Philippine Commission on Higher Education (CHED), nor as government-regulated vocational qualifications under TESDA. The academy’s awards and credentials represent institutional educational achievement and recognition. They do not automatically confer professional licenses, government-recognized academic equivalency, or authorization to practice regulated professions.',
      },
    ],
  },
  {
    id: 'admission',
    title: 'Admission and International Students',
    items: [
      {
        id: 4,
        question: 'Does TMSI-LAPS accept international students?',
        answer:
          'YES. TMSI-LAPS welcomes both Filipino and international students. Our digital correspondence learning system allows qualified applicants from different countries to enroll and study without physically attending classes in the Philippines. International applicants should ensure that the educational program and institutional credentials are appropriate for their personal, professional, or educational objectives and comply with applicable regulations in their respective countries.',
      },
      {
        id: 5,
        question: 'Do international students need to travel to the Philippines?',
        answer:
          'No. Our courses are delivered through digital correspondence and independent home study. Students may study from their homes or workplaces anywhere in the world.',
      },
      {
        id: 6,
        question: 'Is there an age limit for enrollment?',
        answer:
          'Our LEAP programs are primarily intended for mature learners and adults who are capable of independent study. Admission may be subject to program-specific requirements and institutional evaluation.',
      },
      {
        id: 7,
        question: 'Can working professionals and experienced practitioners enroll?',
        answer:
          'Yes. Our programs are designed to accommodate working professionals, experienced practitioners, independent scholars, and lifelong learners. Relevant prior education and professional experience may be considered in institutional evaluations, where applicable.',
      },
    ],
  },
  {
    id: 'enrollment',
    title: 'Enrollment and Course Materials',
    items: [
      {
        id: 8,
        question: 'How can I enroll in a course?',
        answer:
          'Prospective students may request an official enrollment form through the academy’s website or authorized communication channels. After submitting the required information and completing the applicable enrollment procedures, students will receive instructions regarding their course materials and learning requirements.',
      },
      {
        id: 9,
        question: 'How are the course modules delivered?',
        answer:
          'ALL COURSE MODULES ARE PROVIDED AS DOWNLOADABLE PDF FILES. Enrolled students will receive access to the digital course materials applicable to their paid and confirmed enrollment. These materials may be downloaded and saved on a computer, laptop, tablet, or smartphone for convenient independent study.',
      },
      {
        id: 10,
        question: 'Are printed course modules provided?',
        answer:
          'Our standard course delivery is digital. Students may download and print their PDF modules for personal educational use at their own expense.',
      },
      {
        id: 11,
        question: 'Can I study at my own pace?',
        answer:
          'Yes. TMSI-LAPS follows a flexible, self-paced home-study system. Students may organize their learning schedules according to their personal circumstances, subject to any applicable institutional completion requirements.',
      },
      {
        id: 12,
        question: 'Do I need to attend online classes or video conferences?',
        answer:
          'Regular attendance in live online classes is not generally required for our self-paced digital correspondence programs. Any special academic activity or additional requirement will be communicated by the academy.',
      },
    ],
  },
  {
    id: 'exams',
    title: 'Examinations and Assessments',
    items: [
      {
        id: 13,
        question: 'How are final examinations conducted?',
        answer:
          'Final examinations are generally administered through a multiple-choice examination provided with the course materials or issued separately by the academy. Students are expected to study their modules carefully before completing the examination.',
      },
      {
        id: 14,
        question: 'How should I submit my final examination answers?',
        answer:
          'Students must submit ONLY THEIR ANSWERS to the final multiple-choice examination. The answers must be prepared in an A4-size PDF document. The answer sheet should contain the student’s complete name, enrolled course, student number (if issued), date of submission, and numbered answers corresponding to the examination questions. There is no need to reproduce the complete examination questions unless specifically instructed.',
      },
      {
        id: 15,
        question: 'How should essay assignments be submitted?',
        answer:
          'Essay assignments must be prepared in a separate A4-size PDF document. The document should clearly indicate the student’s name, course title, essay topic, and date of submission. Students are expected to submit original, thoughtful, and academically appropriate written responses.',
      },
      {
        id: 16,
        question: 'Where should I email my examination answers and essays?',
        answer:
          'Recommended email subject: FINAL EXAMINATION – [COURSE TITLE] – [STUDENT NAME]. For essay submissions: ESSAY SUBMISSION – [COURSE TITLE] – [STUDENT NAME]. Please attach the required A4 PDF files before sending your email.',
      },
      {
        id: 17,
        question: 'Can I submit photographs or handwritten answers?',
        answer:
          'The standard submission format is an A4-size PDF document. Photographs, image-only submissions, or other formats should not be used unless specifically authorized by the academy.',
      },
      {
        id: 18,
        question: 'What happens after I submit my final examination?',
        answer:
          'The academy will review and evaluate the submitted answers and any required essays. Students who satisfactorily complete the prescribed requirements will be considered for the issuance of their corresponding institutional educational credentials, subject to verification and academic approval.',
      },
    ],
  },
  {
    id: 'credentials',
    title: 'Diplomas, Certificates, and Credentials',
    items: [
      {
        id: 19,
        question: 'What credentials will I receive after completing my course?',
        answer:
          'Depending on the enrolled program and successful fulfillment of its requirements, students may receive applicable institutional credentials, such as:',
        bullets: [
          'Digital Diploma or Certificate',
          'Institutional Learning Record (ILR)',
          'Other program-specific institutional recognition documents, where applicable',
        ],
      },
      {
        id: 20,
        question: 'Are diplomas and certificates issued digitally?',
        answer:
          'YES. ALL STANDARD CREDENTIALS ARE ISSUED AS DIGITAL COPIES. Digital issuance is the academy’s standard method of delivering institutional credentials to successful students.',
      },
      {
        id: 21,
        question: 'Can I request printed copies of my credentials?',
        answer:
          'Yes. Students who prefer physical credentials may request printed copies. Depending on the document and available service, printed credentials may include a formal diploma or certificate and an Institutional Learning Record. Printing, framing, packaging, and delivery may involve additional charges. The academy will provide applicable costs and arrangements upon request.',
      },
      {
        id: 22,
        question: 'Are digital credentials valid institutional documents?',
        answer:
          'Yes. Digital credentials officially issued by TMSI-LAPS serve as institutional records of the student’s educational accomplishment. Their acceptance by employers, professional associations, government agencies, or other educational institutions depends on the receiving organization’s policies and applicable laws.',
      },
      {
        id: 23,
        question: 'Can I use my institutional diploma or certificate for professional licensing?',
        answer:
          'TMSI-LAPS institutional credentials do not independently qualify a holder for government professional licensure or authorize the practice of regulated professions. Students must comply with the applicable laws, professional standards, and licensing requirements in their country or jurisdiction.',
      },
    ],
  },
  {
    id: 'tuition',
    title: 'Tuition, Payments, and Student Support',
    items: [
      {
        id: 24,
        question: 'How much are the course fees?',
        answer:
          'Course fees vary according to the selected program. The latest applicable fees are published in the academy’s official course catalogue or communicated through authorized enrollment channels.',
      },
      {
        id: 25,
        question: 'How can I pay my enrollment fees?',
        answer:
          'The academy provides authorized payment instructions during enrollment. Students should use only the officially designated payment channels and retain proof of payment.',
      },
      {
        id: 26,
        question: 'Can international students make payments?',
        answer:
          'Yes. International applicants may request information about available payment arrangements, currency conversion, and any applicable transaction charges before completing enrollment.',
      },
      {
        id: 27,
        question: 'How can students communicate with the academy?',
        answer:
          'Students may communicate through the academy’s official website, designated email channels, and authorized institutional communication platforms. Academic and administrative inquiries should include the student’s complete name, enrolled program, and student number, where applicable.',
      },
    ],
  },
  {
    id: 'philosophy',
    title: 'Philosophy and Educational Purpose',
    items: [
      {
        id: 28,
        question: 'What makes TMSI-LAPS different from conventional educational institutions?',
        answer:
          'TMSI-LAPS emphasizes philosophical inquiry, metaphysical understanding, consciousness studies, independent learning, and lifelong intellectual and spiritual development. Its educational philosophy recognizes that learning extends beyond formal classrooms and continues throughout human life.',
      },
      {
        id: 29,
        question: 'Does TMSI-LAPS teach Luminarian Philosophy and Transcendentalism?',
        answer:
          'Yes. Luminarian Philosophy and Transcendentalism are important foundations of the academy’s educational orientation. Students are encouraged to develop critical thinking, ethical awareness, reflective understanding, and a deeper appreciation of consciousness and human existence.',
      },
      {
        id: 30,
        question: 'What is the ultimate educational mission of TMSI-LAPS?',
        answer:
          'Our mission is to make philosophical and metaphysical education accessible to sincere learners regardless of geographical location, while cultivating wisdom, self-awareness, compassion, intellectual responsibility, and lifelong personal development. We believe that education is not merely the accumulation of information but a continuing journey toward understanding oneself, humanity, nature, and the greater reality of existence.',
      },
    ],
  },
]

export const FAQ_STUDENT_REMINDER = [
  { label: 'Course Delivery', value: 'Downloadable PDF Modules' },
  { label: 'Learning Method', value: 'Self-Paced Digital Correspondence / Home Study' },
  { label: 'International Students', value: 'Accepted' },
  { label: 'Final Examination', value: 'Multiple-Choice Answers Only, A4 PDF' },
  { label: 'Essay Requirements', value: 'Separate A4 PDF Document' },
  { label: 'Submission Email', value: 'transcendentalism65@yahoo.com' },
  { label: 'Standard Credentials', value: 'Digital Copies' },
  { label: 'Printed Credentials', value: 'Available Upon Request, Subject to Applicable Fees' },
] as const

export const EXAM_SUBMISSION_EMAIL = 'transcendentalism65@yahoo.com'