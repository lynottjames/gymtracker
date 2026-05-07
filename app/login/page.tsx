'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { authenticate } from './actions'
import styles from './login.module.css'

const initialState = { error: null as string | null }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(authenticate, initialState)

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.brand}>GRIND</h1>
          <p className={styles.subtitle}>Track your lifts</p>
        </header>

        <form className={styles.form} action={formAction}>
          {state.error ? (
            <div className={styles.error} role="alert">
              {state.error}
            </div>
          ) : null}

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
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
            <label className={styles.fieldLabel} htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className={styles.textInput}
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={isPending}
            />
          </div>

          <button className={styles.submit} type="submit" disabled={isPending}>
            {isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link className={styles.signUpLink} href="/register">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
