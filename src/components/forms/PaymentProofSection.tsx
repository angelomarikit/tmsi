import { PaymentInstructions } from '@/components/institutional/PaymentInstructions'

type Props = {
  expectedAmountLabel: string
  formId: string
  receiptFooterNote?: string
  className?: string
}

export function PaymentProofSection({
  expectedAmountLabel,
  formId,
  receiptFooterNote,
  className,
}: Props) {
  return (
    <PaymentInstructions
      expectedAmountLabel={expectedAmountLabel}
      formId={formId}
      showReceiptFields
      receiptFooterNote={receiptFooterNote}
      className={className}
    />
  )
}