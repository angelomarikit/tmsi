import { FormField } from '@/components/forms/FormField'

type Props = {
  sessionEmail?: string | null
  inputClass?: 'ivory' | 'white'
}

export function LeapEnrollmentApplicantFields({ sessionEmail, inputClass: _ }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FormField label="Full Name" name="fullName" required />
      <FormField
        label="Email Address"
        name="email"
        type="email"
        required
        defaultValue={sessionEmail ?? ''}
        readOnly={Boolean(sessionEmail)}
      />
      <FormField label="Mobile Number" name="mobile" required />
      <FormField label="Date of Birth" name="dob" type="date" required />
      <FormField label="Address" name="address" className="sm:col-span-2" required />
      <label className="block text-xs font-medium sm:col-span-2">
        Civil Status
        <select
          name="civilStatus"
          className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
          required
        >
          <option value="">Select</option>
          <option>Single</option>
          <option>Married</option>
          <option>Widowed</option>
          <option>Separated</option>
        </select>
      </label>
    </div>
  )
}