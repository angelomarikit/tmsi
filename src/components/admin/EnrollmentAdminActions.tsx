import { Link } from 'react-router-dom'

type Props = {
  applicationId: string
  status: string
}

export function EnrollmentAdminActions({ applicationId, status }: Props) {
  if (status === 'approved') {
    return <span className="text-xs text-emerald-800">Approved</span>
  }

  return (
    <Link
      to="/admin/enrollment-approvals"
      state={{ focusApplicationId: applicationId }}
      className="rounded-md border border-forest/30 bg-forest/10 px-2 py-1 text-[10px] font-medium text-forest hover:bg-forest/20"
    >
      Enrollment approvals
    </Link>
  )
}