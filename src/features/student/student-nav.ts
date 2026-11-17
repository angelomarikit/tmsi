import { BookOpen, Download, GraduationCap, HelpCircle, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type StudentNavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const studentNavItems: StudentNavItem[] = [
  { label: 'My Courses', to: '/dashboard', icon: BookOpen, end: true },
  { label: 'Member downloads', to: '/dashboard/downloads', icon: Download },
  { label: 'Certificates', to: '/dashboard/certificates', icon: GraduationCap },
  { label: 'My Profile', to: '/dashboard/profile', icon: User },
  { label: 'Help & Support', to: '/dashboard/help', icon: HelpCircle },
]