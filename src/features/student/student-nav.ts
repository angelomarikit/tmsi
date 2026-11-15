import {
  BookOpen,
  Download,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type StudentNavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
  /** Shown in nav but route is not implemented yet */
  comingSoon?: boolean
}

export const studentNavItems: StudentNavItem[] = [
  { label: 'My Courses', to: '/dashboard', icon: BookOpen, end: true },
  { label: 'Member downloads', to: '/dashboard/downloads', icon: Download },
  { label: 'Certificates', to: '/dashboard/certificates', icon: GraduationCap, comingSoon: true },
  { label: 'Messages', to: '/dashboard/messages', icon: MessageSquare, comingSoon: true },
  { label: 'My Profile', to: '/dashboard/profile', icon: User, comingSoon: true },
  { label: 'Help & Support', to: '/dashboard/help', icon: HelpCircle, comingSoon: true },
]