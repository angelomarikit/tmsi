import { useStaff } from '@/contexts/StaffContext'
import { Link } from 'react-router-dom'

export function StaffUploadBanner() {
  const { session, isStaff, loading, rolesLoading } = useStaff()

  if (loading || rolesLoading) return null

  if (!session) {
    return (
      <div className="mb-4 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>Uploads require admin sign-in.</strong>{' '}
        <Link to="/login?next=/admin" className="font-medium text-forest underline">
          Sign in as admin
        </Link>{' '}
        to upload eBooks, course PDFs, and images.
      </div>
    )
  }

  if (!isStaff) {
    return (
      <div className="mb-4 rounded-lg border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-950">
        Signed in as {session.user.email}, but this account does not have admin upload permissions.
        Use a registrar or content manager account, or contact your technical administrator.
      </div>
    )
  }

  return null
}