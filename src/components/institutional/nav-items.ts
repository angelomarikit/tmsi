import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  GraduationCap,
  HelpCircle,
  Home,
  Info,
  Mail,
  PenLine,
  Users,
} from 'lucide-react'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  match?: (pathname: string) => boolean
}

export const mainNavItems: NavItem[] = [
  { label: 'Home', to: '/', icon: Home, match: (p) => p === '/' },
  { label: 'About TMSI–LAPS', to: '/about', icon: Info },
  { label: 'FAQ', to: '/faq', icon: HelpCircle },
  {
    label: 'LEAP Courses',
    to: '/courses',
    icon: GraduationCap,
    match: (p) => p.startsWith('/courses'),
  },
  { label: 'Free eBooks', to: '/ebooks', icon: BookOpen },
  { label: 'TMVS Membership', to: '/membership', icon: Users },
  { label: 'Enroll', to: '/enroll', icon: PenLine },
  { label: 'Contact Us', to: '/contact', icon: Mail },
]