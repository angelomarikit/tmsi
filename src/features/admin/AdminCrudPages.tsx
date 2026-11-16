import { AdminDataTable } from '@/components/admin/AdminDataTable'
import { CourseAdminUploadHeader } from '@/components/admin/CourseAdminUploadHeader'
import { CourseEditModal, type CourseEditInitial } from '@/components/admin/CourseEditModal'
import { CourseMaterialsPreviewModal } from '@/components/admin/CourseMaterialsPreviewModal'
import { CourseMaterialsUploadModal } from '@/components/admin/CourseMaterialsUploadModal'
import { CourseRowActions } from '@/components/admin/CourseRowActions'
import { EnrollmentAdminActions } from '@/components/admin/EnrollmentAdminActions'
import { EbookAdminUploadHeader } from '@/components/admin/EbookAdminUploadHeader'
import {
  EbookDocumentModal,
  type EbookModalInitial,
} from '@/components/admin/EbookDocumentModal'
import { EbookAdminActions } from '@/components/admin/EbookAdminActions'
import { EbookRowActions } from '@/components/admin/EbookRowActions'
import { EbookStatusSelect } from '@/components/admin/EbookStatusSelect'
import { MembershipMaterialsUploadModal } from '@/components/admin/MembershipMaterialsUploadModal'
import { fetchMembershipMaterials } from '@/lib/supabase/membership-materials'
import { fetchAdminTmvsMembers } from '@/lib/supabase/membership-workflow'
import { fetchProgramMaterialCounts } from '@/lib/supabase/program-materials'
import { CourseMaterialsAuditBanner } from '@/components/admin/CourseMaterialsAuditBanner'
import { StaffUploadBanner } from '@/components/admin/StaffUploadBanner'
import { AdminPaymentQrPanel } from '@/features/admin/AdminPaymentQrPanel'
import { formatPhp } from '@/lib/utils'
import {
  fetchAdminEbooks,
  fetchAdminEnrollments,
  fetchAdminPayments,
  fetchAdminStudentProfiles,
  fetchAdminProgramsTable,
  fetchInstitutionSettings,
} from '@/lib/supabase/admin-queries'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

function useAdminRows<T>(key: string, queryFn: () => Promise<T[]>) {
  return useQuery({ queryKey: ['admin', key], queryFn, staleTime: 30_000 })
}

export function AdminStudentsPage() {
  const { data: rows = [], isLoading } = useAdminRows('students', fetchAdminStudentProfiles)
  return (
    <AdminDataTable
      title="Students"
      description="Learners with the student role only. Staff and admin accounts (e.g. admin@tmsi.com) are not listed here."
      columns={[
        { key: 'email', header: 'Email', render: (r) => r.email },
        { key: 'name', header: 'Name', render: (r) => r.full_name ?? '—' },
        { key: 'joined', header: 'Joined', render: (r) => new Date(r.created_at).toLocaleDateString() },
      ]}
      rows={rows}
      getRowKey={(r) => r.id}
      emptyMessage={
        isLoading ? 'Loading…' : 'No student profiles yet. Complete auth + enrollment workflow.'
      }
    />
  )
}

export function AdminMembersPage() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: members = [], isLoading } = useAdminRows('tmvs-members', fetchAdminTmvsMembers)
  const { data: materials = [] } = useQuery({
    queryKey: ['admin', 'membership-materials'],
    queryFn: fetchMembershipMaterials,
  })
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'tmvs-members'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'membership-materials'] })
  }

  return (
    <>
      <AdminDataTable
        title="Members"
        description="Approved TMVS members. Upload files they can download after approval (Dashboard → Downloads)."
        actions={
          <button
            type="button"
            className="btn-gloss-green rounded-full px-5 py-2 text-xs font-semibold text-white"
            onClick={() => setUploadOpen(true)}
          >
            Upload
          </button>
        }
        columns={[
          {
            key: 'member',
            header: 'Member',
            render: (r) => r.full_name ?? r.email,
          },
          { key: 'email', header: 'Email', render: (r) => r.email },
          { key: 'ref', header: 'Reference', render: (r) => r.reference_code ?? '—' },
          {
            key: 'approved',
            header: 'Approved',
            render: (r) =>
              r.approved_at ? new Date(r.approved_at).toLocaleDateString() : '—',
          },
        ]}
        rows={members}
        getRowKey={(r) => r.profile_id}
        emptyMessage={isLoading ? 'Loading…' : 'No approved TMVS members yet.'}
      />
      {materials.length > 0 ? (
        <div className="mt-6 rounded-xl border border-gold/30 bg-white p-4">
          <h2 className="text-sm font-semibold text-forest">Published member files ({materials.length})</h2>
          <ul className="mt-2 space-y-1 text-xs text-ink/75">
            {materials.map((m) => (
              <li key={m.id}>{m.label}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <MembershipMaterialsUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={invalidate}
      />
    </>
  )
}

export function AdminApplicationsPage() {
  const { data: rows = [], isLoading } = useAdminRows('applications', fetchAdminEnrollments)
  return (
    <AdminDataTable
      title="Applications"
      description="LEAP enrollment references. Staff login required to review rows blocked by RLS."
      columns={[
        { key: 'ref', header: 'Reference', render: (r) => r.reference_code ?? '—' },
        {
          key: 'name',
          header: 'Applicant',
          render: (r) =>
            (r.payload as { fullName?: string } | null)?.fullName ??
            (r.payload as { full_name?: string } | null)?.full_name ??
            '—',
        },
        {
          key: 'program',
          header: 'Program',
          render: (r) => r.programs?.title ?? r.programs?.code ?? '—',
        },
        { key: 'status', header: 'Status', render: (r) => r.status },
        {
          key: 'date',
          header: 'Submitted',
          render: (r) =>
            r.submitted_at
              ? new Date(r.submitted_at).toLocaleDateString()
              : new Date(r.created_at).toLocaleDateString(),
        },
        {
          key: 'approve',
          header: 'Actions',
          render: (r) => (
            <EnrollmentAdminActions applicationId={r.id} status={r.status} />
          ),
        },
      ]}
      rows={rows}
      getRowKey={(r) => r.id}
      emptyMessage={
        isLoading
          ? 'Loading…'
          : 'No enrollment applications yet — or sign in as registrar to list all records.'
      }
    />
  )
}

function isDbUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

export function AdminCoursesPage() {
  const queryClient = useQueryClient()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editModal, setEditModal] = useState<{ open: boolean; initial: CourseEditInitial | null }>({
    open: false,
    initial: null,
  })
  const [preview, setPreview] = useState<{
    open: boolean
    programId: string
    slug: string
    title: string
  }>({ open: false, programId: '', slug: '', title: '' })
  const {
    data: rows = [],
    isLoading,
    isError: programsQueryError,
  } = useAdminRows('programs-table', fetchAdminProgramsTable)
  const { data: materialCounts = {} } = useQuery({
    queryKey: ['admin', 'program-material-counts'],
    queryFn: fetchProgramMaterialCounts,
  })
  const display = rows

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'programs-table'] })
    void queryClient.invalidateQueries({ queryKey: ['content', 'programs'] })
    void queryClient.invalidateQueries({ queryKey: ['content', 'media'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'program-material-counts'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'course-materials-audit'] })
  }

  function openEdit(row: (typeof display)[number]) {
    setEditModal({
      open: true,
      initial: {
        id: row.id,
        slug: row.slug,
        code: row.code,
        title: row.title,
        subtitle: (row as { subtitle?: string }).subtitle ?? '',
        feePhp: Number(row.fee_php),
        publicationStatus: row.publication_status,
        coverAssetKey: (row as { cover_asset_key?: string }).cover_asset_key ?? null,
      },
    })
  }

  return (
    <>
      <StaffUploadBanner />
      <CourseMaterialsAuditBanner />
    <AdminDataTable
      title="Courses"
      description="Create course adds a row in Supabase; attach PDFs in the same dialog or via Manage / Edit. Students see materials after enrollment approval."
      actions={<CourseAdminUploadHeader onOpenUpload={() => setUploadOpen(true)} />}
      columns={[
        { key: 'code', header: 'Code', render: (r) => r.code },
        { key: 'title', header: 'Title', render: (r) => r.title },
        { key: 'fee', header: 'Fee', render: (r) => formatPhp(Number(r.fee_php)) },
        { key: 'status', header: 'Status', render: (r) => r.publication_status },
        {
          key: 'materials',
          header: 'Materials',
          render: (r) => {
            const n = materialCounts[r.id] ?? materialCounts[r.slug] ?? 0
            return n > 0 ? `${n} file${n === 1 ? '' : 's'}` : '—'
          },
        },
        {
          key: 'carousel',
          header: 'Carousel',
          render: (r) => (r.featured_in_carousel ? 'Yes' : 'No'),
        },
        {
          key: 'view',
          header: 'Preview',
          render: (r) =>
            isDbUuid(r.id) ? (
              <button
                type="button"
                className="text-xs font-semibold text-forest underline"
                onClick={() =>
                  setPreview({
                    open: true,
                    programId: r.id,
                    slug: r.slug,
                    title: r.title,
                  })
                }
              >
                View
              </button>
            ) : (
              <Link to={`/courses/${r.slug}`} className="text-xs text-forest underline">
                Catalog
              </Link>
            ),
        },
        {
          key: 'manage',
          header: 'Manage',
          render: (r) =>
            isDbUuid(r.id) ? (
              <CourseRowActions
                programId={r.id}
                slug={r.slug}
                publicationStatus={r.publication_status}
                onChanged={invalidate}
                onEdit={() => openEdit(r)}
              />
            ) : (
              <span className="text-xs text-ink/50">DB seed required</span>
            ),
        },
      ]}
      rows={display}
      getRowKey={(r) => r.id}
      emptyMessage={
        isLoading
          ? 'Loading…'
          : programsQueryError
            ? 'Could not load courses from Supabase — sign in as staff and refresh.'
            : 'No courses yet — use Create course to add your first program.'
      }
    />
      <CourseMaterialsUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={invalidate}
      />
      <CourseEditModal
        open={editModal.open}
        initial={editModal.initial}
        onClose={() => setEditModal({ open: false, initial: null })}
        onSaved={invalidate}
      />
      <CourseMaterialsPreviewModal
        open={preview.open}
        programId={preview.programId}
        slug={preview.slug}
        title={preview.title}
        onClose={() => setPreview({ open: false, programId: '', slug: '', title: '' })}
      />
    </>
  )
}

import { ebookPdfStorageReady } from '@/lib/ebook-catalog-merge'

export function AdminEbooksPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    initial?: EbookModalInitial
  }>({ open: false, mode: 'create' })
  const { data: rows = [], isLoading } = useAdminRows('ebooks', fetchAdminEbooks)
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'ebooks'] })
    void queryClient.invalidateQueries({ queryKey: ['content', 'ebooks-published'] })
  }

  const display = rows

  function openEdit(row: (typeof display)[number]) {
    const legacySlug = (row as { legacy_slug?: string }).legacy_slug ?? row.id
    setModal({
      open: true,
      mode: 'edit',
      initial: {
        legacySlug,
        title: row.title,
        description: (row as { description?: string | null }).description ?? null,
        publicationStatus: row.publication_status,
        hasPdf: Boolean(row.pdf_path),
      },
    })
  }

  return (
    <>
      <StaffUploadBanner />
    <AdminDataTable
      title="eBooks"
      description="Empty until you Upload a title. Pick PDFs from your computer (not project folders). PDF → Ready → Live. Public /ebooks lists only Live titles you add here."
      actions={
        <EbookAdminUploadHeader
          onOpenUpload={() => setModal({ open: true, mode: 'create' })}
        />
      }
      columns={[
        { key: 'title', header: 'Title', render: (r) => r.title },
        {
          key: 'status',
          header: 'Status',
          render: (r) => {
            const slug = (r as { legacy_slug?: string }).legacy_slug ?? r.id
            return (
              <EbookStatusSelect
                legacySlug={slug}
                publicationStatus={r.publication_status}
                storageReady={ebookPdfStorageReady(r.pdf_path)}
                onChanged={invalidate}
              />
            )
          },
        },
        {
          key: 'rights',
          header: 'Rights',
          render: (r) => (r.rights_confirmed ? 'Confirmed' : 'Not confirmed'),
        },
        {
          key: 'pdf',
          header: 'PDF in Storage',
          render: (r) => {
            const ready = ebookPdfStorageReady(r.pdf_path)
            const fileName = ready ? r.pdf_path?.split('/').pop() : null
            return (
              <div className="max-w-[220px]">
                <span
                  className={
                    ready
                      ? 'inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900'
                      : 'inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-950'
                  }
                >
                  {ready ? 'Ready' : 'Upload required'}
                </span>
                {ready && fileName ? (
                  <p className="mt-1 truncate text-[10px] text-ink/55" title={r.pdf_path ?? ''}>
                    {fileName}
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-ink/55">No file</p>
                )}
              </div>
            )
          },
        },
        {
          key: 'manage',
          header: 'Manage',
          render: (r) => {
            const slug = (r as { legacy_slug?: string }).legacy_slug ?? r.id
            return (
              <div className="flex max-w-[280px] flex-col gap-2">
                <EbookAdminActions legacySlug={slug} onChanged={invalidate} />
                <EbookRowActions
                  legacySlug={slug}
                  publicationStatus={r.publication_status}
                  onChanged={invalidate}
                  onEdit={() => openEdit(r)}
                />
              </div>
            )
          },
        },
      ]}
      rows={display}
      getRowKey={(r) => r.id}
      emptyMessage={
        isLoading
          ? 'Loading…'
          : 'No eBooks yet. Use Upload to add a title and PDF; nothing is pre-loaded.'
      }
    />
      <EbookDocumentModal
        open={modal.open}
        mode={modal.mode}
        initial={modal.initial}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSaved={invalidate}
      />
    </>
  )
}

export function AdminPaymentsPage() {
  const { data: rows = [], isLoading } = useAdminRows('payments', fetchAdminPayments)
  return (
    <>
    <AdminPaymentQrPanel />
    <AdminDataTable
      title="Receipt verification"
      description="Metrobank / InstaPay receipt queue from enrollment and membership forms."
      columns={[
        { key: 'ref', header: 'Reference', render: (r) => r.reference_number },
        { key: 'amt', header: 'Amount', render: (r) => formatPhp(Number(r.declared_amount)) },
        { key: 'status', header: 'Status', render: (r) => r.status },
        {
          key: 'date',
          header: 'Paid',
          render: (r) => (r.payment_date ? r.payment_date : '—'),
        },
      ]}
      rows={rows}
      getRowKey={(r) => r.id}
      emptyMessage={
        isLoading ? 'Loading…' : 'No payment submissions yet.'
      }
    />
    </>
  )
}

export function AdminReportsPage() {
  return (
    <AdminDataTable
      title="Reports"
      description="Enrollment and revenue exports will appear after transactional data is recorded."
      columns={[{ key: 'r', header: 'Report', render: () => 'Enrollment summary' }]}
      rows={[]}
      getRowKey={() => 'r'}
      emptyMessage="Generate reports once applications and payments are flowing."
    />
  )
}

export function AdminSettingsPage() {
  const { data: rows = [], isLoading } = useAdminRows('settings', fetchInstitutionSettings)
  return (
    <AdminDataTable
      title="Settings"
      description="Institution keys (homepage, payment panel). Approve payment_metrobank before hiding warnings on enroll."
      columns={[
        { key: 'key', header: 'Key', render: (r) => r.key },
        {
          key: 'approved',
          header: 'Approved',
          render: (r) => (r.approved ? 'Yes' : 'No'),
        },
        {
          key: 'updated',
          header: 'Updated',
          render: (r) => new Date(r.updated_at).toLocaleDateString(),
        },
      ]}
      rows={rows}
      getRowKey={(r) => r.key}
      emptyMessage={isLoading ? 'Loading…' : 'No institution settings rows — run migration 009.'}
    />
  )
}