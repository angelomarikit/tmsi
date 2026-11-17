type Props = { title: string }

export function StudentPlaceholderPage({ title }: Props) {
  return (
    <p className="text-sm text-ink/70">
      <strong className="text-forest">{title}</strong> will be expanded in a future release. My
      This section is coming soon.
    </p>
  )
}