const TECHNICAL =
  /supabase|vite_supabase|postgrest|pgrst|migration\s*\d|sql editor|user_roles|row-level security|\brls\b|private-documents|public-assets|content_items|staff_register_program_material|admin_probe|gen_random_uuid|\.env\.local|rpc missing|could not register file in database/i

const SERVICE_UNAVAILABLE =
  'This feature is temporarily unavailable. Please try again later or contact TMSI–LAPS support.'

/** Map errors and copy for learners and public pages — no backend vendor or infrastructure names. */
export function userFacingError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  const msg = raw.trim()
  if (!msg) return fallback

  if (/supabase is not configured|service unavailable|temporarily unavailable/i.test(msg)) {
    return SERVICE_UNAVAILABLE
  }

  if (/^SERVICE_UNAVAILABLE$/i.test(msg)) {
    return SERVICE_UNAVAILABLE
  }

  if (
    /already registered|already been registered|user already exists|email address is already|duplicate key.*profiles_email/i.test(
      msg,
    )
  ) {
    return 'An account with this email already exists. Sign in with your existing password — you do not need to create another account.'
  }

  if (TECHNICAL.test(msg)) {
    let cleaned = msg
      .replace(/^\[Storage\]\s*/i, '')
      .replace(/^\[Database\]\s*/i, '')
      .replace(/\s*[—–-]\s*run migrations?[^\n]*/gi, '')
      .replace(/\s*[—–-]\s*assign super_admin[^\n]*/gi, '')
      .replace(/\s*[—–-]\s*confirm migration[^\n]*/gi, '')
      .replace(/\(HTTP \d+\)[^\n]*/gi, '')
      .trim()

    if (!cleaned || TECHNICAL.test(cleaned)) return fallback
    if (cleaned.length > 320) return `${cleaned.slice(0, 317)}…`
    return cleaned
  }

  if (msg.length > 400) return `${msg.slice(0, 397)}…`
  return msg
}

export function userFacingToastDescription(
  description: string | undefined,
  fallback?: string,
): string | undefined {
  if (!description?.trim()) return fallback
  return userFacingError(new Error(description), fallback ?? 'Please try again later.')
}

export const SERVICE_UNAVAILABLE_MESSAGE = SERVICE_UNAVAILABLE