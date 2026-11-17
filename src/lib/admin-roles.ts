/** Roles that can upload course PDFs / use Admin (matches Supabase is_staff()). */
export const ADMIN_UPLOAD_ROLE_SLUGS = ['super_admin', 'registrar', 'content_manager'] as const

export const ADMIN_UPLOAD_ROLE_SET = new Set<string>(ADMIN_UPLOAD_ROLE_SLUGS)

export function hasAdminUploadRole(slugs: string[]): boolean {
  return slugs.some((s) => ADMIN_UPLOAD_ROLE_SET.has(s))
}