import {
  BookOpen,
  BookText,
  CreditCard,
  FileStack,
  GraduationCap,
  Image,
  LayoutDashboard,
  LineChart,
  Settings,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AdminNavItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const adminNavItems: AdminNavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Students', to: '/admin/students', icon: GraduationCap },
  { label: 'Members', to: '/admin/members', icon: Users },
  { label: 'Applications', to: '/admin/applications', icon: FileStack },
  { label: 'Enrollment Approvals', to: '/admin/enrollment-approvals', icon: GraduationCap },
  { label: 'Membership Approvals', to: '/admin/membership-approvals', icon: Users },
  { label: 'Courses', to: '/admin/courses', icon: BookText },
  { label: 'eBooks', to: '/admin/ebooks', icon: BookOpen },
  { label: 'Payments', to: '/admin/payments', icon: CreditCard },
  { label: 'CMS', to: '/admin/cms/images', icon: Image },
  { label: 'Reports', to: '/admin/reports', icon: LineChart },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]