import { institutionalDisclosure } from '@/data/programs'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type StaticContentPageProps = {
  title: string
  children?: ReactNode
}

export function StaticContentPage({ title, children }: StaticContentPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-forest">{title}</h1>
      <div className="prose prose-sm mt-6 max-w-none text-ink/85">{children}</div>
    </div>
  )
}

export function AboutPage() {
  return (
    <StaticContentPage title="About TMSI–LAPS">
      <p>
        TMSI–Luminarian Academy of Philosophical Studies is an independent institution
        devoted to lifelong learning, metaphysical inquiry, philosophical development and
        transcendental education. Through LEAP, the Academy offers self-paced
        digital-correspondence study for adult learners, practitioners and individuals
        pursuing philosophical and personal development.
      </p>
      <p className="mt-4">{institutionalDisclosure}</p>
      <p className="mt-6">
        <Link to="/courses" className="font-medium text-forest underline">
          Explore LEAP courses
        </Link>
      </p>
    </StaticContentPage>
  )
}

export function PrivacyPage() {
  return (
    <StaticContentPage title="Privacy Policy">
      <p>Draft placeholder — legal text requires client approval before publication.</p>
    </StaticContentPage>
  )
}

export function TermsPage() {
  return (
    <StaticContentPage title="Terms of Use">
      <p>Draft placeholder — legal text requires client approval before publication.</p>
    </StaticContentPage>
  )
}