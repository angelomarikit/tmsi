import { getSupabaseClient } from '@/lib/supabase/client'
import { uploadPrivateDocument } from '@/lib/supabase/cms-upload'

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
}

function refCode() {
  const part = Date.now().toString(36).toUpperCase()
  return `LEAP-${part}`
}

export async function submitLeapEnrollment(payload: EnrollmentSubmitPayload) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) {
    throw new Error('Sign in or create an account before enrolling')
  }
  const userId = userData.user.id

  const { data: existing } = await supabase
    .from('enrollment_applications')
    .select('id, status')
    .eq('applicant_id', userId)
    .eq('program_id', payload.programId)
    .in('status', ['submitted', 'under_review', 'correction_requested', 'approved'])
    .maybeSingle()

  if (existing) {
    throw new Error(
      'You already have an active application for this course. Check My Enrollments on your dashboard.',
    )
  }

  const reference = refCode()
  const { data: application, error: appErr } = await supabase
    .from('enrollment_applications')
    .insert({
      applicant_id: userId,
      program_id: payload.programId,
      status: 'submitted',
      reference_code: reference,
      payload: {
        fullName: payload.fullName,
        email: payload.email,
        mobile: payload.mobile,
        dateOfBirth: payload.dateOfBirth,
        address: payload.address,
        civilStatus: payload.civilStatus,
      },
      submitted_at: new Date().toISOString(),
    })
    .select('id, reference_code')
    .single()

  if (appErr || !application) {
    throw new Error(appErr?.message ?? 'Could not create enrollment application')
  }

  const ext = payload.receiptFile.name.split('.').pop() ?? 'jpg'
  const receiptPath = `enrollment-receipts/${userId}/${application.id}/receipt.${ext}`
  await uploadPrivateDocument(receiptPath, payload.receiptFile)

  const { error: payErr } = await supabase.from('payment_submissions').insert({
    application_type: 'leap_enrollment',
    application_id: application.id,
    declared_amount: payload.declaredAmount,
    reference_number: payload.paymentReference,
    receipt_path: receiptPath,
    payment_date: payload.paymentDate || null,
    status: 'submitted',
  })

  if (payErr) throw new Error(payErr.message)

  await supabase
    .from('profiles')
    .update({ full_name: payload.fullName, mobile: payload.mobile })
    .eq('id', userId)

  await supabase.from('in_app_notifications').insert({
    user_id: userId,
    kind: 'enrollment_submitted',
    title: 'Enrollment submitted',
    body: 'Your application and payment details were received. Course materials stay locked until admin approval.',
    link_path: '/dashboard',
  })

  return {
    referenceCode: application.reference_code ?? reference,
    applicationId: application.id,
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
  if (!supabase) throw new Error('Supabase is not configured')

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

  const { data: existingPay } = await supabase
    .from('payment_submissions')
    .select('id, receipt_path')
    .eq('application_id', app.id)
    .eq('application_type', 'leap_enrollment')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingPay?.receipt_path) {
    throw new Error('Payment proof is already on file for this enrollment')
  }

  const ext = payload.receiptFile.name.split('.').pop() ?? 'jpg'
  const receiptPath = `enrollment-receipts/${userId}/${app.id}/receipt.${ext}`
  await uploadPrivateDocument(receiptPath, payload.receiptFile)

  if (existingPay?.id) {
    const { error: upErr } = await supabase
      .from('payment_submissions')
      .update({
        reference_number: payload.paymentReference.trim(),
        receipt_path: receiptPath,
        payment_date: payload.paymentDate || null,
        declared_amount: payload.declaredAmount,
        status: 'submitted',
      })
      .eq('id', existingPay.id)
    if (upErr) throw new Error(upErr.message)
  } else {
    const { error: payErr } = await supabase.from('payment_submissions').insert({
      application_type: 'leap_enrollment',
      application_id: app.id,
      declared_amount: payload.declaredAmount,
      reference_number: payload.paymentReference.trim(),
      receipt_path: receiptPath,
      payment_date: payload.paymentDate || null,
      status: 'submitted',
    })
    if (payErr) throw new Error(payErr.message)
  }
}