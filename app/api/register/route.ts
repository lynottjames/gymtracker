import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

interface RegisterBody {
  name?: string
  email?: string
  password?: string
}

export async function POST(request: Request) {
  let body: RegisterBody
  try {
    body = (await request.json()) as RegisterBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const emailRaw = typeof body.email === 'string' ? body.email.trim() : ''
  const password =
    typeof body.password === 'string' ? body.password : ''
  const nameTrimmed =
    typeof body.name === 'string' ? body.name.trim() : ''

  if (!emailRaw)
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  if (!password)
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })

  const existing = await prisma.user.findUnique({
    where: { email: emailRaw },
    select: { id: true },
  })

  if (existing)
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 400 }
    )

  const passwordHash = await hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        email: emailRaw,
        password: passwordHash,
        name: nameTrimmed || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      )
    console.error('Register failed:', error)
    return NextResponse.json(
      { error: 'Unable to create account.' },
      { status: 500 }
    )
  }
}
