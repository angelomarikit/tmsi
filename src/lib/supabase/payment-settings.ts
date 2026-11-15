import { getVisualAsset } from '@/data/visual-assets'
import { getSupabaseClient } from '@/lib/supabase/client'
import { updateMediaAssetPath, uploadPublicAssetFile } from '@/lib/supabase/cms-upload'

const QR_ASSET_KEY = 'payment.metrobank_qr' as const
const SETTING_KEY = 'payment_metrobank'

export async function uploadMetrobankQrFile(file: File): Promise<string> {
  const slot = getVisualAsset(QR_ASSET_KEY)
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const storagePath = `payment/metrobank-instaPay-qr.${ext}`
  const publicUrl = await uploadPublicAssetFile(storagePath, file)
  await updateMediaAssetPath(QR_ASSET_KEY, publicUrl, slot.category, slot.cmsLabel)
  return publicUrl
}

export async function setPaymentMetrobankApproved(approved: boolean) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase is not configured')

  const { error } = await supabase
    .from('institution_settings')
    .update({ approved })
    .eq('key', SETTING_KEY)
  if (error) throw error
}

export async function fetchPaymentMetrobankApproved(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data, error } = await supabase
    .from('institution_settings')
    .select('approved')
    .eq('key', SETTING_KEY)
    .maybeSingle()

  if (error || !data) return false
  return data.approved === true
}