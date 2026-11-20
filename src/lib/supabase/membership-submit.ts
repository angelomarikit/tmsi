import { getSupabaseClient } from '@/lib/supabase/client'
import { uploadPrivateDocument } from '@/lib/supabase/cms-upload'

export const TMVS_MEMBERSHIP_FEE_PHP = 2500

export type MembershipRegisterPayload = {
  email: string
  password: string
  fullName: string
  mobile: string
  dateOfBirth: string
  address: string
  profession: string
  background: string
  paymentReference: string
  paymentDate: string
  receiptFile: File
}

function refCode() {
  return `TMVS-${Date.now().toString(36).toUpperCase()}`
}

export type MembershipApplyPayload = Omit<MembershipRegisterPayload, 'password' | 'email'> & {
  email: string
}

async function createTmvsMembershipApplication(
  userId: string,
  email: string,
  payload: MembershipApplyPayload,
) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: existing } = await supabase
    .from('membership_applications')
    .select('id, status')
    .eq('applicant_id', userId)
    .in('status', ['submitted', 'under_review', 'correction_requested', 'approved'])
    .maybeSingle()

  if (existing) {
    throw new Error(
      'You already have an active TMVS application. Open Member Downloads to upload payment proof or check status.',
    )
  }

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      full_name: payload.fullName,
      mobile: payload.mobile,
    })
    .eq('id', userId)

  if (profileErr) throw new Error(profileErr.message)

  const reference = refCode()
  const { data: application, error: appErr } = await supabase
    .from('membership_applications')
    .insert({
      applicant_id: userId,
      package_code: 'digital',
      status: 'submitted',
      reference_code: reference,
      payload: {
        fullName: payload.fullName,
        email,
        mobile: payload.mobile,
        dateOfBirth: payload.dateOfBirth,
        address: payload.address,
        profession: payload.profession,
        background: payload.background,
      },
      submitted_at: new Date().toISOString(),
    })
    .select('id, reference_code')
    .single()

  if (appErr || !application) {
    throw new Error(appErr?.message ?? 'Could not submit membership application')
  }

  const ext = payload.receiptFile.name.split('.').pop() ?? 'jpg'
  const receiptPath = `membership-receipts/${userId}/${application.id}/receipt.${ext}`
  await uploadPrivateDocument(receiptPath, payload.receiptFile)

  const { error: payErr } = await supabase.from('payment_submissions').insert({
    application_type: 'tmvs_membership',
    application_id: application.id,
    declared_amount: TMVS_MEMBERSHIP_FEE_PHP,
    reference_number: payload.paymentReference.trim(),
    receipt_path: receiptPath,
    payment_date: payload.paymentDate || null,
    status: 'submitted',
  })

  if (payErr) throw new Error(payErr.message)

  await supabase.from('in_app_notifications').insert({
    user_id: userId,
    kind: 'membership_submitted',
    title: 'Membership submitted',
    body: 'Your TMVS application and payment proof were received. Downloads unlock after registrar approval.',
    link_path: '/dashboard/downloads',
  })

  return {
    referenceCode: application.reference_code ?? reference,
    applicationId: application.id,
  }
}

export async function submitTmvsMembershipForLoggedInUser(
  payload: Omit<MembershipRegisterPayload, 'password' | 'email'>,
) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user?.email) {
    throw new Error('Sign in to apply for TMVS membership')
  }

  const email = userData.user.email.trim().toLowerCase()
  return createTmvsMembershipApplication(userData.user.id, email, {
    ...payload,
    email,
  })
}

export async function registerAndSubmitTmvsMembership(payload: MembershipRegisterPayload) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const email = payload.email.trim().toLowerCase()

  const { data: userData } = await supabase.auth.getUser()
  const signedIn = userData.user
  const sessionEmail = signedIn?.email?.trim().toLowerCase()

  if (signedIn?.id && sessionEmail) {
    if (sessionEmail !== email) {
      throw new Error(
        'You are signed in with a different email. Use the dashboard to apply, or sign out and sign in with the email on this form.',
      )
    }
    return createTmvsMembershipApplication(signedIn.id, sessionEmail, {
      fullName: payload.fullName,
      mobile: payload.mobile,
      dateOfBirth: payload.dateOfBirth,
      address: payload.address,
      profession: payload.profession,
      background: payload.background,
      paymentReference: payload.paymentReference,
      paymentDate: payload.paymentDate,
      receiptFile: payload.receiptFile,
      email: sessionEmail,
    })
  }

  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: { data: { full_name: payload.fullName } },
  })
  if (signUpErr) throw new Error(signUpErr.message)
  if (!signUpData.user?.id) throw new Error('Could not create account')
  const userId = signUpData.user.id

  return createTmvsMembershipApplication(userId, email, {
    fullName: payload.fullName,
    mobile: payload.mobile,
    dateOfBirth: payload.dateOfBirth,
    address: payload.address,
    profession: payload.profession,
    background: payload.background,
    paymentReference: payload.paymentReference,
    paymentDate: payload.paymentDate,
    receiptFile: payload.receiptFile,
    email,
  })
}

export type MembershipPaymentProofPayload = {
  applicationId: string
  paymentReference: string
  paymentDate: string
  receiptFile: File
}

/** For an existing TMVS application that was submitted without payment proof. */
export async function uploadTmvsMembershipPaymentProof(payload: MembershipPaymentProofPayload) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) throw new Error('Sign in to upload your payment receipt')
  const userId = userData.user.id

  const { data: app, error: appErr } = await supabase
    .from('membership_applications')
    .select('id, applicant_id, status')
    .eq('id', payload.applicationId)
    .maybeSingle()

  if (appErr || !app) throw new Error('Application not found')
  if (app.applicant_id !== userId) throw new Error('Not your application')
  if (!['submitted', 'under_review', 'correction_requested', 'draft'].includes(app.status)) {
    throw new Error('This application can no longer accept payment uploads')
  }

  const { data: existingPay } = await supabase
    .from('payment_submissions')
    .select('id')
    .eq('application_id', app.id)
    .eq('application_type', 'tmvs_membership')
    .limit(1)
    .maybeSingle()

  if (existingPay) {
    throw new Error('Payment proof is already on file for this application')
  }

  const ext = payload.receiptFile.name.split('.').pop() ?? 'jpg'
  const receiptPath = `membership-receipts/${userId}/${app.id}/receipt.${ext}`
  await uploadPrivateDocument(receiptPath, payload.receiptFile)

  const { error: payErr } = await supabase.from('payment_submissions').insert({
    application_type: 'tmvs_membership',
    application_id: app.id,
    declared_amount: TMVS_MEMBERSHIP_FEE_PHP,
    reference_number: payload.paymentReference.trim(),
    receipt_path: receiptPath,
    payment_date: payload.paymentDate || null,
    status: 'submitted',
  })

  if (payErr) throw new Error(payErr.message)
}