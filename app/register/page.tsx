'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import styles from '../login/login.module.css'

interface RegisterResponseBody {
  error?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '')
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    setIsPending(true)
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const json = (await response.json()) as RegisterResponseBody

      if (!response.ok) {
        setError(
          json.error ??
            (response.status === 400
              ? 'Unable to create account.'
              : 'Something went wrong. Try again.')
        )
        return
      }

      router.push('/login')
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.brand}>GRIND</h1>
          <p className={styles.subtitle}>Create your account</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="register-name">
              Name
            </label>
            <input
              id="register-name"
              className={styles.textInput}
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              className={styles.textInput}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              className={styles.textInput}
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              disabled={isPending}
            />
          </div>

          <button className={styles.submit} type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link className={styles.signUpLink} href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
