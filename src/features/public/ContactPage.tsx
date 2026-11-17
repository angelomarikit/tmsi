import { Mail, Phone, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

const INQUIRY_TYPES = [
  'LEAP Courses and Programs',
  'Enrollment and Registration',
  'Tuition and Payment Verification',
  'TMVS Membership',
  'Student Account Assistance',
  'Certificates and Documents',
  'General Inquiries',
] as const

const OFFICIAL_EMAIL = 'transcendentalism65@yahoo.com'

const PHONE_NUMBERS = ['0997 736 2496', '0924 008 7066', '0947 497 2469'] as const

function phoneHref(display: string) {
  return `tel:${display.replace(/\s/g, '')}`
}

export function ContactPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [inquiryType, setInquiryType] = useState<string>(INQUIRY_TYPES[0])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please complete all required fields.')
      return
    }

    const body = [
      `Full name: ${fullName.trim()}`,
      `Email: ${email.trim()}`,
      mobile.trim() ? `Contact number: ${mobile.trim()}` : null,
      `Inquiry type: ${inquiryType}`,
      '',
      message.trim(),
    ]
      .filter(Boolean)
      .join('\n')

    const mailto = `mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent(
      `[TMSI–LAPS] ${subject.trim()}`,
    )}&body=${encodeURIComponent(body)}`

    window.location.href = mailto
    toast.success('Thank you — your email app will open to send the message to TMSI–LAPS.')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="text-center">
        <h1 className="font-display text-3xl font-semibold text-forest sm:text-4xl">
          Contact TMSI–LAPS
        </h1>
        <p className="mt-3 font-display text-lg text-ink/80">We&apos;re Here to Assist You on Your Learning Journey</p>
      </header>

      <div className="mt-8 space-y-5 text-sm leading-relaxed text-ink/85">
        <p>
          Thank you for your interest in the{' '}
          <strong>Transcendental Metaphysical Science Institute – Luminarian Academy of Philosophical Studies (TMSI–LAPS).</strong>
        </p>
        <p>
          Whether you are exploring our Lifelong Education Advancement Program (LEAP), seeking information
          about course enrollment, interested in TMVS membership, or requiring assistance with your existing
          student account, we welcome your inquiries.
        </p>
        <p>
          Our team is available to provide information and guidance regarding our educational programs,
          registration procedures, membership applications, and general institutional services.
        </p>
      </div>

      <section className="mt-10 rounded-xl border border-gold/35 bg-ivory p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-xl font-semibold text-forest">Get in Touch</h2>

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Official Email Address</p>
            <a
              href={`mailto:${OFFICIAL_EMAIL}`}
              className="mt-1 inline-flex items-center gap-2 text-base font-medium text-forest underline"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {OFFICIAL_EMAIL}
            </a>
            <p className="mt-2 text-xs text-ink/65">
              For course inquiries, enrollment assistance, membership registration, payment verification
              concerns, and general correspondence.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Contact Numbers</p>
            <ul className="mt-2 space-y-2">
              {PHONE_NUMBERS.map((num) => (
                <li key={num}>
                  <a
                    href={phoneHref(num)}
                    className="inline-flex items-center gap-2 font-medium text-forest underline"
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden />
                    {num}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink/65">
              You may contact us through any of the numbers above for assistance with your inquiries.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-forest">Send Us a Message</h2>
        <p className="mt-2 text-sm text-ink/80">
          Have a question or need additional information? Complete the contact form below, and our team will
          review your inquiry.
        </p>

        <form
          className="mt-6 space-y-4 rounded-xl border border-gold/30 bg-white p-5 shadow-sm sm:p-6"
          onSubmit={onSubmit}
        >
          <label className="block text-xs font-medium text-ink">
            Full Name <span className="text-red-700">*</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
              autoComplete="name"
            />
          </label>

          <label className="block text-xs font-medium text-ink">
            Email Address <span className="text-red-700">*</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
              autoComplete="email"
            />
          </label>

          <label className="block text-xs font-medium text-ink">
            Contact Number <span className="font-normal text-ink/50">(Optional)</span>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
              autoComplete="tel"
            />
          </label>

          <label className="block text-xs font-medium text-ink">
            Inquiry Type
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
            >
              {INQUIRY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-ink">
            Subject <span className="text-red-700">*</span>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs font-medium text-ink">
            Message <span className="text-red-700">*</span>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
            />
          </label>

          <p className="text-xs text-ink/60">
            Information submitted through this form will be used to respond to your inquiry in accordance
            with our{' '}
            <Link to="/privacy" className="text-forest underline">
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            className="btn-gloss-green inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white sm:w-auto sm:px-8"
          >
            <Send className="h-4 w-4" aria-hidden />
            Send Message
          </button>
        </form>
      </section>

      <section className="mt-12 rounded-xl border border-gold/25 bg-gradient-to-br from-cream to-ivory p-6 text-center shadow-sm">
        <h2 className="font-display text-lg font-semibold text-forest">Begin Your Learning Journey</h2>
        <p className="mt-2 text-sm text-ink/80">
          Explore our educational programs, discover opportunities for lifelong learning, and connect with the
          TMSI–LAPS community.
        </p>
        <div className="mt-5 flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/courses"
            className="btn-gloss-green rounded-full px-5 py-2.5 text-sm font-semibold text-white no-underline"
          >
            Explore LEAP Courses
          </Link>
          <Link
            to="/enroll"
            className="rounded-full border border-forest/35 bg-white px-5 py-2.5 text-sm font-semibold text-forest no-underline shadow-sm hover:bg-forest/5"
          >
            Enroll Online
          </Link>
          <Link
            to="/membership"
            className="rounded-full border border-gold/50 bg-gold/15 px-5 py-2.5 text-sm font-semibold text-forest no-underline shadow-sm hover:bg-gold/25"
          >
            TMVS Membership
          </Link>
        </div>
      </section>
    </div>
  )
}