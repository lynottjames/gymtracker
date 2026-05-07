'use server'

import { CredentialsSignin } from 'next-auth'
import { signIn } from '@/auth'

function isNextRedirect(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const digest = (error as { digest?: unknown }).digest
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')
}

export async function authenticate(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/dashboard',
    })
  } catch (error) {
    if (isNextRedirect(error)) throw error
    if (error instanceof CredentialsSignin)
      return { error: 'Invalid email or password.' }
    console.error(error)
    return { error: 'Something went wrong. Try again.' }
  }
  return { error: null }
}
