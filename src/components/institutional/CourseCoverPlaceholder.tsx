import type { VisualAssetKey } from '@/data/visual-assets'
import {
  Atom,
  BookOpen,
  Crown,
  Flame,
  Leaf,
  Lightbulb,
  Mountain,
  Sparkles,
  Sun,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const themeByKey: Record<
  VisualAssetKey,
  { icon: typeof BookOpen; gradient: string; label: string }
> = {
  'course.dms': {
    icon: Sparkles,
    gradient: 'from-indigo-900/80 via-violet-800/60 to-emerald-institutional',
    label: 'Metaphysical study',
  },
  'course.dms_tin': {
    icon: Leaf,
    gradient: 'from-emerald-800 via-green-700 to-teal-900',
    label: 'Integrative naturopathy',
  },
  'course.phd_ticm': {
    icon: Atom,
    gradient: 'from-slate-800 via-emerald-900 to-cyan-900',
    label: 'Integrative philosophy',
  },
  'course.dms_vitalogy': {
    icon: Flame,
    gradient: 'from-amber-700 via-orange-800 to-emerald-950',
    label: 'Vitality & consciousness',
  },
  'course.dms_llvt': {
    icon: Sun,
    gradient: 'from-amber-400 via-yellow-600/80 to-emerald-institutional',
    label: 'Light & vitality',
  },
  'course.tph_cert': {
    icon: Mountain,
    gradient: 'from-sky-900 via-emerald-800 to-stone-700',
    label: 'Transcendentalism',
  },
  'course.luminarian_order': {
    icon: Crown,
    gradient: 'from-yellow-700 via-amber-600 to-emerald-900',
    label: 'Luminarian pathway',
  },
  'course.lecs_dip': {
    icon: Lightbulb,
    gradient: 'from-teal-900 to-emerald-950',
    label: 'Healing arts',
  },
  'course.lecs_fel': {
    icon: BookOpen,
    gradient: 'from-emerald-900 via-forest to-gold/40',
    label: 'Advanced study',
  },
  'brand.logo': { icon: BookOpen, gradient: '', label: '' },
  'homepage.hero.banner': { icon: BookOpen, gradient: '', label: '' },
  'homepage.hero.left': { icon: BookOpen, gradient: '', label: '' },
  'homepage.hero.right': { icon: BookOpen, gradient: '', label: '' },
  'masthead.background': { icon: BookOpen, gradient: '', label: '' },
  'masthead.decorative': { icon: BookOpen, gradient: '', label: '' },
  'payment.metrobank_qr': { icon: BookOpen, gradient: '', label: '' },
}

type CourseCoverPlaceholderProps = {
  assetKey: VisualAssetKey
  className?: string
}

export function CourseCoverPlaceholder({ assetKey, className }: CourseCoverPlaceholderProps) {
  const theme = themeByKey[assetKey]
  const Icon = theme.icon

  return (
    <div
      className={cn(
        'flex aspect-[4/3] min-h-full w-full flex-col items-center justify-center bg-gradient-to-br px-3 text-center text-white',
        theme.gradient,
        className,
      )}
    >
      <Icon className="h-10 w-10 text-gold-light opacity-90" strokeWidth={1.25} aria-hidden />
      <p className="mt-2 text-[10px] uppercase tracking-wider text-white/80">{theme.label}</p>
      <p className="mt-1 text-[9px] text-white/60">Cover pending CMS</p>
    </div>
  )
}