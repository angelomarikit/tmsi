import { BookOpen, Users } from 'lucide-react'

type Props = {
  onPurchaseCourse: () => void
  onApplyMembership: () => void
}

export function StudentDashboardHub({ onPurchaseCourse, onApplyMembership }: Props) {
  return (
    <div className="mb-8 rounded-xl border border-gold/30 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-forest">Learner hub</h2>
      <p className="mt-1 text-sm text-ink/75">
        Purchase LEAP courses and/or apply for TMVS membership — separate tracks, one login. Pay via
        Metrobank QR and upload payment proof in each flow.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-gloss-green inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          onClick={onPurchaseCourse}
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          Purchase a LEAP course
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-cream px-5 py-2.5 text-sm font-semibold text-forest"
          onClick={onApplyMembership}
        >
          <Users className="h-4 w-4" aria-hidden />
          Apply for TMVS membership
        </button>
      </div>
    </div>
  )
}