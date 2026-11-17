import { Link } from 'react-router-dom'

export function StudentHelpPage() {
  return (
    <section className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-forest">Help &amp; Support</h1>
      <p className="mt-1 text-sm text-ink/70">
        Open to all students — you do not need an active enrollment to contact TMSI.
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-gold/30 bg-white p-5 text-sm text-ink/85 shadow-sm">
        <div>
          <h2 className="font-semibold text-forest">Registrar &amp; enrollment</h2>
          <p className="mt-1 text-xs leading-relaxed">
            Questions about LEAP enrollment, payment verification, or course access — include your reference
            code from My Courses.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-forest">TMVS membership</h2>
          <p className="mt-1 text-xs leading-relaxed">
            Optional society membership is separate from courses. Apply from the dashboard or{' '}
            <Link to="/membership" className="text-forest underline">
              membership page
            </Link>
            .
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-forest">Technical issues</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
            <li>Cannot sign in — reset password on the login screen.</li>
            <li>Course materials empty — wait for enrollment approval, then open Continue Learning.</li>
            <li>Certificate missing — staff may still be uploading; check Certificates after approval.</li>
          </ul>
        </div>
      </div>

      <p className="mt-6 text-xs text-ink/55">
        Official contact details are published on the{' '}
        <Link to="/contact" className="text-forest underline">
          Contact
        </Link>{' '}
        page when available in CMS.
      </p>
    </section>
  )
}