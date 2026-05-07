import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './lib/prisma'

const nextAuth = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const emailRaw = credentials?.email
        const passwordRaw = credentials?.password
        if (typeof emailRaw !== 'string' || typeof passwordRaw !== 'string') return null

        const email = emailRaw.trim()
        if (!email || !passwordRaw) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null

        const valid = await compare(passwordRaw, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})

export const { auth, signIn, signOut } = nextAuth
export const { GET, POST } = nextAuth.handlers
