import { EXAM_SUBMISSION_EMAIL, FAQ_SECTIONS, FAQ_STUDENT_REMINDER } from '@/data/faq-content'
import { Link } from 'react-router-dom'

export function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="border-b border-gold/25 pb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/55">
          Frequently Asked Questions
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-forest sm:text-3xl">
          TMSI–Luminarian Academy of Philosophical Studies
        </h1>
        <p className="mt-1 text-sm font-medium text-ink/75">
          Transcendental Metaphysical Science Institute – Philippines (TMSI-PH)
        </p>
        <p className="mt-1 text-sm text-forest">Lifelong Education Advancement Program (LEAP)</p>
        <p className="mt-4 font-display text-base italic text-gold sm:text-lg">
          Learn Anywhere. Study at Your Own Pace. Advance Your Knowledge.
        </p>
      </header>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink/85">
        <p>
          Welcome to TMSI–Luminarian Academy of Philosophical Studies (TMSI-LAPS), an institution
          dedicated to lifelong learning, metaphysical education, transcendental philosophy,
          consciousness studies, and holistic personal development.
        </p>
        <p>
          The following Frequently Asked Questions will guide prospective and enrolled students
          through our educational programs, enrollment procedures, learning system, examinations,
          and institutional credentials.
        </p>
      </div>

      <nav
        className="mt-8 rounded-xl border border-gold/25 bg-ivory/80 p-4 text-sm"
        aria-label="FAQ sections"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Jump to section</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {FAQ_SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#faq-${section.id}`} className="text-forest underline hover:text-forest/80">
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 space-y-12">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.id} id={`faq-${section.id}`} className="scroll-mt-24">
            <h2 className="font-display text-xl font-semibold text-forest">{section.title}</h2>
            <ul className="mt-4 space-y-4">
              {section.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-gold/25 bg-white p-4 shadow-sm sm:p-5"
                >
                  <h3 className="flex gap-2 text-sm font-semibold text-forest">
                    <span className="shrink-0 text-ink/45">{item.id}.</span>
                    <span>{item.question}</span>
                  </h3>
                  <div className="mt-2 pl-6 text-sm leading-relaxed text-ink/85">
                    {item.id === 16 ? (
                      <>
                        <p>
                          All completed final examination answers and required essays must be sent
                          to{' '}
                          <a
                            href={`mailto:${EXAM_SUBMISSION_EMAIL}`}
                            className="font-medium text-forest underline"
                          >
                            {EXAM_SUBMISSION_EMAIL}
                          </a>
                          .
                        </p>
                        <p className="mt-2">{item.answer}</p>
                      </>
                    ) : (
                      <p>{item.answer}</p>
                    )}
                    {item.bullets?.length ? (
                      <ul className="mt-2 list-inside list-disc space-y-1">
                        {item.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-xl border-2 border-gold/40 bg-gradient-to-br from-cream to-ivory p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-forest">Important Student Reminder</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {FAQ_STUDENT_REMINDER.map((row) => (
            <div key={row.label} className="rounded-lg border border-gold/20 bg-white/80 px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink/55">
                {row.label}
              </dt>
              <dd className="mt-0.5 text-ink/90">
                {row.label === 'Submission Email' ? (
                  <a
                    href={`mailto:${EXAM_SUBMISSION_EMAIL}`}
                    className="font-medium text-forest underline"
                  >
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10 text-center">
        <h2 className="font-display text-lg font-semibold text-forest">Official Contact Information</h2>
        <Link
          to="/contact"
          className="btn-gloss-green mt-4 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white no-underline"
        >
          Contact Us
        </Link>
        <p className="mt-6 font-display text-sm font-medium tracking-wide text-gold">
          AD LUCEM — TOWARD THE LIGHT
        </p>
      </section>
    </div>
  )
}