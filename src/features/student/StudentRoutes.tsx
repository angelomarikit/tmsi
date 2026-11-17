import { StudentCourseReaderPage } from '@/features/student/StudentCourseReaderPage'
import { StudentDashboardHome } from '@/features/student/StudentDashboardHome'
import { StudentDashboardLayout } from '@/features/student/StudentDashboardLayout'
import { StudentMembershipDownloadsPage } from '@/features/student/StudentMembershipDownloadsPage'
import { StudentCertificatesPage } from '@/features/student/StudentCertificatesPage'
import { StudentHelpPage } from '@/features/student/StudentHelpPage'
import { StudentProfilePage } from '@/features/student/StudentProfilePage'
import { Navigate, Route, Routes } from 'react-router-dom'

export function StudentRoutes() {
  return (
    <Routes>
      <Route element={<StudentDashboardLayout />}>
        <Route index element={<StudentDashboardHome />} />
        <Route path="enrollments" element={<StudentDashboardHome />} />
        <Route path="certificates" element={<StudentCertificatesPage />} />
        <Route path="downloads" element={<StudentMembershipDownloadsPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="help" element={<StudentHelpPage />} />
        <Route path="courses/:courseId" element={<StudentCourseReaderPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}