import type { AdminMembershipRow } from '@/lib/supabase/membership-workflow'

export function membershipPayloadString(payload: AdminMembershipRow['payload'], key: string): string {
  if (!payload) return ''
  const v = payload[key]
  return typeof v === 'string' ? v : ''
}

export function displayMembershipFullName(row: AdminMembershipRow): string {
  return (
    row.full_name?.trim() ||
    membershipPayloadString(row.payload, 'fullName').trim() ||
    '—'
  )
}

export function displayMembershipEmail(row: AdminMembershipRow): string {
  return row.email?.trim() || membershipPayloadString(row.payload, 'email').trim() || '—'
}