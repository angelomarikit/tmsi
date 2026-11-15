import { StudentCourseReaderPage } from '@/features/student/StudentCourseReaderPage'
import { StudentDashboardHome } from '@/features/student/StudentDashboardHome'
import { StudentDashboardLayout } from '@/features/student/StudentDashboardLayout'
import { StudentMembershipDownloadsPage } from '@/features/student/StudentMembershipDownloadsPage'
import { StudentPlaceholderPage } from '@/features/student/StudentPlaceholderPage'
import { Navigate, Route, Routes } from 'react-router-dom'

export function StudentRoutes() {
  return (
    <Routes>
      <Route element={<StudentDashboardLayout />}>
        <Route index element={<StudentDashboardHome />} />
        <Route path="enrollments" element={<StudentDashboardHome />} />
        <Route path="certificates" element={<StudentPlaceholderPage title="Certificates" />} />
        <Route path="downloads" element={<StudentMembershipDownloadsPage />} />
        <Route path="messages" element={<StudentPlaceholderPage title="Messages" />} />
        <Route path="profile" element={<StudentPlaceholderPage title="My Profile" />} />
        <Route path="help" element={<StudentPlaceholderPage title="Help & Support" />} />
        <Route path="courses/:courseId" element={<StudentCourseReaderPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}