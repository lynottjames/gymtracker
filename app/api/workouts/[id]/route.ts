import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!id)
      return NextResponse.json({ error: 'Workout id is required' }, { status: 400 })

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    })

    if (!workout)
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })

    return NextResponse.json({ workout })
  } catch (error: unknown) {
    console.error('Failed to fetch workout:', error)
    return NextResponse.json({ error: 'Unable to fetch workout' }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!id)
      return NextResponse.json({ error: 'Workout id is required' }, { status: 400 })

    const existingWorkout = await prisma.workout.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingWorkout)
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })

    await prisma.workout.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Failed to delete workout:', error)
    return NextResponse.json({ error: 'Unable to delete workout' }, { status: 500 })
  }
}
