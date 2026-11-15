import { institutionalDisclosure } from '@/data/programs'

type FooterProps = {
  tagline?: string
}

export function InstitutionalFooter({
  tagline = 'Education • Consciousness • Vitality • Service to Humanity',
}: FooterProps) {
  return (
    <footer className="mt-auto border-t-4 border-gold bg-emerald-institutional text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-6 text-center sm:px-6">
        <p className="font-display text-sm tracking-wide text-gold-light">
          TMSI–LAPS | {tagline}
        </p>
        <p className="mx-auto mt-4 max-w-3xl text-xs leading-relaxed text-white/80">
          {institutionalDisclosure}
        </p>
        <p className="mt-3 text-[10px] text-white/60">
          © {new Date().getFullYear()} TMSI–Luminarian Academy of Philosophical
          Studies. Developed by Apex Technology Philippines Co.
        </p>
      </div>
    </footer>
  )
}