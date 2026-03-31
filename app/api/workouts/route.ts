import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const workouts = await prisma.workout.findMany({
      orderBy: { date: 'desc' },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    })

    return NextResponse.json({ workouts })
  } catch (error: unknown) {
    console.error('Failed to fetch workouts:', error)
    return NextResponse.json(
      { error: 'Unable to fetch workouts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; date?: string }
    const { name, date } = body

    if (!name?.trim())
      return NextResponse.json(
        { error: 'Workout name is required' },
        { status: 400 }
      )

    if (!date)
      return NextResponse.json(
        { error: 'Workout date is required' },
        { status: 400 }
      )

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime()))
      return NextResponse.json({ error: 'Invalid workout date' }, { status: 400 })

    const workout = await prisma.workout.create({
      data: {
        name: name.trim(),
        date: parsedDate,
      },
    })

    return NextResponse.json({ workout }, { status: 201 })
  } catch (error: unknown) {
    console.error('Failed to create workout:', error)
    return NextResponse.json(
      { error: 'Unable to create workout' },
      { status: 500 }
    )
  }
}
