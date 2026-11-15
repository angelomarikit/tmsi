import { ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

type Props = {
  open: boolean
  busy: boolean
  title?: string
  confirmLabel?: string
  onClose: () => void
  onConfirm: () => void
}

export function DataPrivacyConsentModal({
  open,
  busy,
  title = 'Your data is protected',
  confirmLabel = 'Confirm and submit',
  onClose,
  onConfirm,
}: Props) {
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (open) setAcknowledged(false)
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-consent-title"
        className="w-full max-w-md rounded-2xl border border-gold/35 bg-ivory p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-forest">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="privacy-consent-title" className="font-display text-lg font-semibold text-forest">
                {title}
              </h2>
              <p className="mt-1 text-xs text-ink/70">
                TMSI–LAPS complies with the Philippine Data Privacy Act (Republic Act No. 10173).
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-ink/60 hover:bg-cream"
            aria-label="Close"
            onClick={onClose}
            disabled={busy}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-gold/25 bg-white px-4 py-3 text-xs leading-relaxed text-ink/80">
          <p>
            Information you provide is collected only for membership processing, payment verification
            (when applicable), credentials, and official correspondence.
          </p>
          <p>
            TMSI applies appropriate security controls and limits access to authorized personnel. Your
            data is not sold or used for unrelated marketing.
          </p>
          <p>
            See our{' '}
            <Link to="/privacy" className="font-medium text-forest underline" onClick={onClose}>
              Privacy Policy
            </Link>{' '}
            for your rights as a data subject.
          </p>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-ink/85">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gold/50 text-forest focus:ring-forest"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            disabled={busy}
          />
          <span>
            I confirm that I understand my personal data will be kept <strong>secure</strong> and processed
            in line with TMSI&rsquo;s Data Privacy Act obligations.
          </span>
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold text-forest"
            onClick={onClose}
            disabled={busy}
          >
            Go back
          </button>
          <button
            type="button"
            disabled={!acknowledged || busy}
            className="btn-gloss-green rounded-full px-5 py-2 text-xs font-semibold text-white disabled:opacity-45"
            onClick={onConfirm}
          >
            {busy ? 'Submitting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}