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
        with a role in <code className="text-xs">user_roles</code> to upload eBooks, course PDFs, and
        images.
      </div>
    )
  }

  if (!isStaff) {
    return (
      <div className="mb-4 rounded-lg border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-950">
        Signed in as {session.user.email}, but <strong>no super_admin</strong> role is in Supabase{' '}
        <code className="text-xs">user_roles</code>. PDF upload needs super_admin (registrar and
        content_manager also work).
      </div>
    )
  }

  return null
}