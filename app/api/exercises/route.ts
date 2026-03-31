export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

interface SetInput {
  reps?: number
  weight?: number
}

interface CreateExerciseBody {
  name?: string
  workoutId?: string
  sets?: SetInput[]
}

type ParseResult =
  | { ok: true; sets: { reps: number; weight: number }[] }
  | { ok: false; message: string }

function parseSetsInput(sets: SetInput[] | undefined): ParseResult {
  if (!Array.isArray(sets))
    return { ok: false, message: 'sets must be an array' }

  const normalized: { reps: number; weight: number }[] = []

  for (let index = 0; index < sets.length; index += 1) {
    const item = sets[index]
    if (typeof item?.reps !== 'number' || !Number.isFinite(item.reps))
      return { ok: false, message: `sets[${index}].reps must be a finite number` }

    if (typeof item?.weight !== 'number' || !Number.isFinite(item.weight))
      return { ok: false, message: `sets[${index}].weight must be a finite number` }

    if (!Number.isInteger(item.reps) || item.reps < 0)
      return { ok: false, message: `sets[${index}].reps must be a non-negative integer` }

    normalized.push({ reps: item.reps, weight: item.weight })
  }

  return { ok: true, sets: normalized }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateExerciseBody
    const { name, workoutId, sets: rawSets } = body

    if (!name?.trim())
      return NextResponse.json({ error: 'Exercise name is required' }, { status: 400 })

    if (!workoutId?.trim())
      return NextResponse.json({ error: 'workoutId is required' }, { status: 400 })

    const parsedSets = parseSetsInput(rawSets ?? [])
    if (parsedSets.ok === false) {
        return NextResponse.json(
          { error: parsedSets.message },
            { status: 400 }
      )
    }

    const { sets: normalizedSets } = parsedSets

    const exercise = await prisma.$transaction(async (tx) => {
      const workout = await tx.workout.findUnique({
        where: { id: workoutId.trim() },
        select: { id: true },
      })

      if (!workout) return null

      return tx.exercise.create({
        data: {
          name: name.trim(),
          workoutId: workoutId.trim(),
          sets: {
            create: normalizedSets,
          },
        },
        include: {
          sets: true,
        },
      })
    })

    if (!exercise)
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })

    return NextResponse.json({ exercise }, { status: 201 })
  } catch (error: unknown) {
    console.error('Failed to create exercise:', error)
    return NextResponse.json({ error: 'Unable to create exercise' }, { status: 500 })
  }
}
