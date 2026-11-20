import { getSupabaseClient } from '@/lib/supabase/client'
import { uploadPrivateDocument } from '@/lib/supabase/cms-upload'
import { userFacingError } from '@/lib/user-facing-message'

export type EnrollmentSubmitPayload = {
  programId: string
  fullName: string
  email: string
  mobile: string
  dateOfBirth: string
  address: string
  civilStatus: string
  paymentReference: string
  paymentDate: string
  declaredAmount: number
  receiptFile: File
  /** When set, withdraw this pending application before enrolling (wrong course). */
  withdrawApplicationId?: string
}

function refCode() {
  const part = Date.now().toString(36).toUpperCase()
  return `LEAP-${part}`
}

function friendlyEnrollmentError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err)
  if (/row-level security|RLS|violates row-level security/i.test(raw)) {
    return new Error(
      'We could not save your enrollment. Sign out, sign in again, and retry. If it continues, contact the registrar.',
    )
  }
  if (/unique|duplicate|payment_submissions_reference/i.test(raw)) {
    return new Error(
      'That payment reference is already on file. Use a new reference number or contact the registrar.',
    )
  }
  if (/already have an active application/i.test(raw)) {
    return new Error(raw)
  }
  return new Error(userFacingError(err, 'Enrollment submission failed. Please try again.'))
}

export async function submitLeapEnrollment(payload: EnrollmentSubmitPayload) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('SERVICE_UNAVAILABLE')

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) {
    throw new Error('Sign in or create an account before enrolling')
  }
  const userId = userData.user.id

  if (payload.withdrawApplicationId) {
    const { error: withdrawErr } = await supabase.rpc('student_withdraw_enrollment', {
      p_application_id: payload.withdrawApplicationId,
    })
    if (withdrawErr) {
      throw friendlyEnrollmentError(withdrawErr)
    }
  } else {
    await supabase.rpc('student_withdraw_other_pending_enrollments', {
      p_program_id: payload.programId,
    })
  }

  const payloadJson = {
    fullName: payload.fullName,
    email: payload.email,
    mobile: payload.mobile,
    dateOfBirth: payload.dateOfBirth,
    address: payload.address,
    civilStatus: payload.civilStatus,
  }

  let applicationId: string
  let referenceCode: string

  const { data: openRows, error: openErr } = await supabase.rpc('student_find_open_enrollment', {
    p_program_id: payload.programId,
  })
  if (openErr) {
    throw friendlyEnrollmentError(openErr)
  }

  const open = (openRows ?? [])[0] as
    | { application_id: string; reference_code: string; has_payment: boolean }
    | undefined

  if (open?.has_payment) {
    throw new Error(
      'You already have an application with payment on file for this course. Open My Courses on your dashboard.',
    )
  }

  if (open?.application_id) {
    applicationId = open.application_id
    referenceCode = open.reference_code
    const { error: updErr } = await supabase.rpc('student_refresh_open_enrollment', {
      p_application_id: applicationId,
      p_payload: payloadJson,
    })
    if (updErr) throw friendlyEnrollmentError(updErr)
  } else {
    const reference = refCode()
    const { data: created, error: createErr } = await supabase.rpc(
      'student_create_enrollment_application',
      {
        p_program_id: payload.programId,
        p_payload: payloadJson,
        p_reference_code: reference,
      },
    )
    if (createErr || !created?.length) {
      throw friendlyEnrollmentError(createErr ?? new Error('Could not create enrollment'))
    }
    const row = created[0] as { application_id: string; reference_code: string }
    applicationId = row.application_id
    referenceCode = row.reference_code
  }

  const ext = payload.receiptFile.name.split('.').pop() ?? 'jpg'
  const receiptPath = `enrollment-receipts/${userId}/${applicationId}/receipt.${ext}`
  try {
    await uploadPrivateDocument(receiptPath, payload.receiptFile)
  } catch (err) {
    throw friendlyEnrollmentError(err)
  }

  const { error: payErr } = await supabase.rpc('student_attach_enrollment_payment', {
    p_application_id: applicationId,
    p_reference_number: payload.paymentReference.trim(),
    p_receipt_path: receiptPath,
    p_payment_date: payload.paymentDate || null,
    p_declared_amount: payload.declaredAmount,
  })
  if (payErr) throw friendlyEnrollmentError(payErr)

  await supabase
    .from('profiles')
    .update({ full_name: payload.fullName, mobile: payload.mobile })
    .eq('id', userId)

  const { error: notifyErr } = await supabase.from('in_app_notifications').insert({
    user_id: userId,
    kind: 'enrollment_submitted',
    title: 'Enrollment submitted',
    body: 'Your application and payment details were received. Course materials stay locked until admin approval.',
    link_path: '/dashboard',
  })
  if (notifyErr) {
    /* non-blocking */
  }

  return {
    referenceCode,
    applicationId,
  }
}

export type EnrollmentPaymentProofPayload = {
  applicationId: string
  paymentReference: string
  paymentDate: string
  declaredAmount: number
  receiptFile: File
}

export async function uploadLeapEnrollmentPaymentProof(payload: EnrollmentPaymentProofPayload) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('SERVICE_UNAVAILABLE')

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error('Sign in to upload your payment receipt')
  const userId = userData.user.id

  const { data: app, error: appErr } = await supabase
    .from('enrollment_applications')
    .select('id, applicant_id, status, program_id')
    .eq('id', payload.applicationId)
    .maybeSingle()

  if (appErr || !app) throw new Error('Enrollment not found')
  if (app.applicant_id !== userId) throw new Error('Not your enrollment')
  if (!['submitted', 'under_review', 'correction_requested', 'draft'].includes(app.status)) {
    throw new Error('This enrollment can no longer accept payment uploads')
  }

  const ext = payload.receiptFile.name.split('.').pop() ?? 'jpg'
  const receiptPath = `enrollment-receipts/${userId}/${app.id}/receipt.${ext}`
  await uploadPrivateDocument(receiptPath, payload.receiptFile)

  const { error: payErr } = await supabase.rpc('student_attach_enrollment_payment', {
    p_application_id: app.id,
    p_reference_number: payload.paymentReference.trim(),
    p_receipt_path: receiptPath,
    p_payment_date: payload.paymentDate || null,
    p_declared_amount: payload.declaredAmount,
  })
  if (payErr) throw friendlyEnrollmentError(payErr)
}

/** Pending LEAP applications for this user (for wrong-course withdraw in UI). */
export async function fetchMyPendingEnrollments() {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return []

  const { data, error } = await supabase
    .from('enrollment_applications')
    .select('id, program_id, reference_code, status, programs(title, slug)')
    .eq('applicant_id', uid)
    .in('status', ['submitted', 'under_review', 'correction_requested', 'draft'])
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function withdrawEnrollmentApplication(applicationId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('SERVICE_UNAVAILABLE')
  const { error } = await supabase.rpc('student_withdraw_enrollment', {
    p_application_id: applicationId,
  })
  if (error) throw friendlyEnrollmentError(error)
}