import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  AdminApplicationsPage,
  AdminCoursesPage,
  AdminEbooksPage,
  AdminMembersPage,
  AdminPaymentsPage,
  AdminReportsPage,
  AdminSettingsPage,
  AdminStudentsPage,
} from '@/features/admin/AdminCrudPages'
import { AdminCourseMaterialsPage } from '@/features/admin/AdminCourseMaterialsPage'
import { AdminEnrollmentApprovalsPage } from '@/features/admin/AdminEnrollmentApprovalsPage'
import { AdminMembershipApprovalsPage } from '@/features/admin/AdminMembershipApprovalsPage'
import { AdminEbookDetailPage } from '@/features/admin/AdminEbookDetailPage'
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage'
import { ImageManagerPage } from '@/features/admin/ImageManagerPage'
import { Navigate, Route, Routes } from 'react-router-dom'

export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="members" element={<AdminMembersPage />} />
        <Route path="applications" element={<AdminApplicationsPage />} />
        <Route path="enrollment-approvals" element={<AdminEnrollmentApprovalsPage />} />
        <Route path="membership-approvals" element={<AdminMembershipApprovalsPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="courses/:slug/materials" element={<AdminCourseMaterialsPage />} />
        <Route path="ebooks" element={<AdminEbooksPage />} />
        <Route path="ebooks/:legacySlug" element={<AdminEbookDetailPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="cms/images" element={<ImageManagerPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}