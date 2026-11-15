import { FormField } from '@/components/forms/FormField'

type Props = {
  sessionEmail?: string | null
  includePassword?: boolean
}

export function TmvsMembershipApplicantFields({ sessionEmail, includePassword = false }: Props) {
  return (
    <>
      <FormField label="Full Name (Last, First, Middle)" name="fullName" required />
      {includePassword ? (
        <>
          <FormField
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="Used to sign in"
          />
          <label className="block text-xs font-medium">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium">
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
            />
          </label>
        </>
      ) : (
        <FormField
          label="Email (sign-in)"
          name="email"
          type="email"
          required
          defaultValue={sessionEmail ?? ''}
          readOnly={Boolean(sessionEmail)}
        />
      )}
      <FormField label="Mobile Number" name="mobile" required />
      <FormField label="Date of Birth" name="dob" type="date" required />
      <label className="block text-xs font-medium">
        Address
        <textarea
          name="address"
          required
          rows={2}
          className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
        />
      </label>
      <FormField label="Profession / Field of Practice" name="profession" />
      <label className="block text-xs font-medium">
        Brief Background / Interest (50–200 words)
        <textarea
          name="background"
          rows={4}
          className="mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm"
        />
      </label>
    </>
  )
}