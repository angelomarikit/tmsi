import { ContentProvider } from '@/contexts/ContentContext'
import { StaffProvider } from '@/contexts/StaffContext'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminRoutes } from '@/features/admin/AdminRoutes'
import { AuthPlaceholderPage } from '@/features/auth/AuthPlaceholderPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { StudentRoutes } from '@/features/student/StudentRoutes'
import { ContactPage } from '@/features/public/ContactPage'
import {
  AboutPage,
  FaqPage,
  PrivacyPage,
  TermsPage,
} from '@/features/public/StaticContentPage'
import { CourseDetailPage } from '@/features/public/CourseDetailPage'
import { CoursesPage } from '@/features/public/CoursesPage'
import { EbooksPage } from '@/features/public/EbooksPage'
import { EnrollPage } from '@/features/public/EnrollPage'
import { HomePage } from '@/features/public/HomePage'
import { MembershipPage } from '@/features/public/MembershipPage'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

export default function App() {
  return (
    <BrowserRouter>
      <StaffProvider>
        <ContentProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:slug" element={<CourseDetailPage />} />
          <Route path="ebooks" element={<EbooksPage />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="enroll" element={<EnrollPage />} />
          <Route path="learning" element={<Navigate to="/dashboard" replace />} />
          <Route path="learning/:slug" element={<Navigate to="/dashboard" replace />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<AuthPlaceholderPage />} />
        </Route>

        <Route path="dashboard/*" element={<StudentRoutes />} />
        <Route path="admin/*" element={<AdminRoutes />} />
      </Routes>
      <Toaster position="top-center" richColors closeButton />
        </ContentProvider>
      </StaffProvider>
    </BrowserRouter>
  )
}