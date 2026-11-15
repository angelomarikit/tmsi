export function LeapProgramsSectionHeader({ id }: { id: string }) {
  return (
    <div className="relative mb-6 flex w-full items-center justify-center px-2">
      <div
        className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gold/70"
        aria-hidden
      />
      <div
        className="relative z-10 min-w-[min(100%,320px)] border-2 border-gold bg-gradient-to-b from-forest to-emerald-institutional px-6 py-2.5 text-center shadow-md sm:min-w-[360px] sm:px-10"
        style={{
          clipPath:
            'polygon(6% 0%, 94% 0%, 100% 50%, 94% 100%, 6% 100%, 0% 50%)',
        }}
      >
        <h2
          id={id}
          className="font-display text-xs font-semibold tracking-[0.28em] text-white sm:text-sm sm:tracking-[0.32em]"
        >
          OUR LEAP PROGRAMS
        </h2>
      </div>
    </div>
  )
}