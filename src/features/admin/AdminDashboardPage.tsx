import { VisualAssetImage } from '@/components/institutional/VisualAssetImage'
import { useContent, useLeapPrograms } from '@/contexts/ContentContext'
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats'
import { fetchAdminEnrollments } from '@/lib/supabase/admin-queries'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  CreditCard,
  FileStack,
  FolderOpen,
  PlusCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

const emptyStats = {
  students: 0,
  members: 0,
  pending_applications: 0,
  pending_payments: 0,
  missing_materials: 0,
  published_ebooks: 0,
}

function statusClass(status: string) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-900'
  if (status === 'correction_requested') return 'bg-amber-100 text-amber-950'
  if (status === 'submitted' || status === 'draft') return 'bg-slate-100 text-slate-800'
  return 'bg-sky-100 text-sky-900'
}

export function AdminDashboardPage() {
  const { programsFromDb, apiReady } = useContent()
  const programs = useLeapPrograms()
  const { data: liveStats } = useAdminDashboardStats()
  const stats = liveStats ?? emptyStats

  const { data: applications = [] } = useQuery({
    queryKey: ['admin', 'applications', 'recent'],
    queryFn: fetchAdminEnrollments,
    staleTime: 30_000,
  })

  const statCards = [
    { label: 'Students', value: stats.students, tone: 'good' as const },
    { label: 'Members', value: stats.members, tone: 'good' as const },
    { label: 'Pending Applications', value: stats.pending_applications, tone: 'warn' as const },
    { label: 'Pending Payments', value: stats.pending_payments, tone: 'warn' as const },
    { label: 'Missing Materials', value: stats.missing_materials, tone: 'alert' as const },
    { label: 'Published eBooks', value: stats.published_ebooks, tone: 'neutral' as const },
  ]

  const pendingTasks = [
    { label: 'Applications for Review', count: stats.pending_applications },
    { label: 'Payments for Verification', count: stats.pending_payments },
    { label: 'Missing Course Materials', count: stats.missing_materials },
  ]

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-gold/40 bg-white shadow-md">
        <div className="relative flex min-h-[120px] items-center gap-4 bg-gradient-to-r from-forest/95 via-emerald-institutional to-forest/90 px-5 py-6 sm:px-8">
          <VisualAssetImage
            assetKey="brand.logo"
            className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-gold shadow-lg sm:h-20 sm:w-20"
            imgClassName="object-cover"
            fallback={<span className="text-gold">TMSI</span>}
          />
          <div className="relative z-10 max-w-2xl text-white">
            <h1 className="font-display text-xl font-semibold sm:text-2xl">
              Welcome, Super Admin!
            </h1>
            <p className="mt-1 text-sm text-white/90">
              Manage students, members, applications, courses, payments, and content at
              TMSI–LAPS.
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-gold-light/90">
              {apiReady
                ? programsFromDb
                  ? 'Online CMS connected'
                  : 'Course catalog not loaded yet'
                : 'Site backend not configured'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="rounded-xl border border-gold/30 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-xs font-medium text-ink/70">{card.label}</p>
            <p
              className={cn(
                'mt-1 font-display text-3xl font-semibold',
                card.tone === 'alert' && 'text-red-700',
                card.tone === 'warn' && 'text-amber-800',
                (card.tone === 'good' || card.tone === 'neutral') && 'text-forest',
              )}
            >
              {card.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl border border-gold/30 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-forest">Enrollment Trend</h2>
          <p className="mt-6 text-center text-sm text-ink/55">
            Charts appear as enrollment activity is recorded.
          </p>
        </article>

        <article className="rounded-xl border border-gold/30 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-forest">Quick Actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <QuickAction to="/admin/courses" icon={PlusCircle} label="Manage Courses" />
            <QuickAction to="/admin/applications" icon={FileStack} label="Review Applications" />
            <QuickAction to="/admin/payments" icon={CreditCard} label="Verify Payments" />
            <QuickAction to="/admin/cms/images" icon={FolderOpen} label="Visual Assets" />
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <article className="overflow-hidden rounded-xl border border-gold/30 bg-white shadow-sm">
          <h2 className="border-b border-gold/20 px-5 py-4 font-display text-lg font-semibold text-forest">
            Recent Applications
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-cream text-xs uppercase tracking-wide text-ink/65">
                <tr>
                  <th className="px-4 py-2 font-medium">Ref.</th>
                  <th className="px-4 py-2 font-medium">Applicant</th>
                  <th className="px-4 py-2 font-medium">Program</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ink/55">
                      No applications yet.
                    </td>
                  </tr>
                ) : (
                  applications.slice(0, 8).map((row) => (
                    <tr key={row.id} className="border-t border-gold/15">
                      <td className="px-4 py-3 text-xs text-ink/80">
                        {row.reference_code ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-forest">
                        {(row.payload as { fullName?: string } | null)?.fullName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-ink/85">
                        {row.programs?.title ?? row.programs?.code ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                            statusClass(row.status),
                          )}
                        >
                          {row.status.replaceAll('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-gold/30 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-forest">Pending Tasks</h2>
          <ul className="mt-4 space-y-3">
            {pendingTasks.map((task) => (
              <li
                key={task.label}
                className="flex items-center justify-between rounded-lg border border-gold/20 bg-ivory px-3 py-2.5 text-sm"
              >
                <span className="text-ink/85">{task.label}</span>
                <span className="font-display text-lg font-semibold text-forest">
                  {task.count}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink/60">
            {programs.length} LEAP programs ·{' '}
            <Link to="/courses" className="text-forest underline">
              View public catalogue
            </Link>
          </p>
        </article>
      </section>
    </div>
  )
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: LucideIcon
  label: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border border-gold/35 bg-cream px-3 py-3 text-sm font-medium text-forest transition hover:bg-gold/15"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold-dark" aria-hidden />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 opacity-50" aria-hidden />
    </Link>
  )
}