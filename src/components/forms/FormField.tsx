export function FormField({
  label,
  name,
  type = 'text',
  required,
  className,
  defaultValue,
  readOnly,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  className?: string
  defaultValue?: string
  readOnly?: boolean
  placeholder?: string
}) {
  return (
    <label className={`block text-xs font-medium ${className ?? ''}`}>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-md border border-gold/35 bg-ivory px-3 py-2 text-sm ${readOnly ? 'bg-cream text-ink/70' : ''}`}
      />
    </label>
  )
}