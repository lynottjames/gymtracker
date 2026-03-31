import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const WORKOUT_NAMES = ['Push Day', 'Pull Day', 'Leg Day', 'Upper Day'] as const

type WorkoutName = (typeof WORKOUT_NAMES)[number]

interface ExerciseTemplate {
  name: string
  weightStart: number
  weightEnd: number
  repsStart: number
  repsEnd: number
}

const TEMPLATES: Record<WorkoutName, ExerciseTemplate[]> = {
  'Push Day': [
    { name: 'Bench Press', weightStart: 70, weightEnd: 90, repsStart: 10, repsEnd: 5 },
    { name: 'Overhead Press', weightStart: 42, weightEnd: 54, repsStart: 8, repsEnd: 5 },
    { name: 'Tricep Dips', weightStart: 22.5, weightEnd: 37.5, repsStart: 12, repsEnd: 8 },
  ],
  'Pull Day': [
    { name: 'Deadlift', weightStart: 100, weightEnd: 140, repsStart: 8, repsEnd: 4 },
    { name: 'Barbell Row', weightStart: 60, weightEnd: 82.5, repsStart: 10, repsEnd: 6 },
    { name: 'Bicep Curl', weightStart: 15, weightEnd: 22.5, repsStart: 12, repsEnd: 8 },
  ],
  'Leg Day': [
    { name: 'Squat', weightStart: 90, weightEnd: 120, repsStart: 8, repsEnd: 5 },
    { name: 'Leg Press', weightStart: 140, weightEnd: 200, repsStart: 12, repsEnd: 8 },
    {
      name: 'Romanian Deadlift',
      weightStart: 80,
      weightEnd: 110,
      repsStart: 10,
      repsEnd: 5,
    },
  ],
  'Upper Day': [
    { name: 'Incline Bench', weightStart: 55, weightEnd: 72.5, repsStart: 10, repsEnd: 5 },
    { name: 'Pull Ups', weightStart: 82.5, weightEnd: 92.5, repsStart: 10, repsEnd: 6 },
    { name: 'Lateral Raise', weightStart: 10, weightEnd: 16, repsStart: 15, repsEnd: 10 },
  ],
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function roundWeight(kg: number): number {
  return Math.round(kg * 2) / 2
}

function sessionNoise(): number {
  return (Math.random() - 0.5) * 5
}

function targetRepsForWeek(template: ExerciseTemplate, weekProgress: number): number {
  const r = lerp(template.repsStart, template.repsEnd, weekProgress)
  return Math.max(3, Math.round(r))
}

function targetWeightForWeek(
  template: ExerciseTemplate,
  weekProgress: number,
  setIndex: number,
  totalSets: number
): number {
  const base = lerp(template.weightStart, template.weightEnd, weekProgress)
  const taper = totalSets > 1 ? (setIndex / (totalSets - 1)) * 1.5 : 0
  return roundWeight(base + sessionNoise() - taper)
}

function repsForSet(baseReps: number, setIndex: number, totalSets: number): number {
  if (setIndex === totalSets - 1 && totalSets >= 3) return Math.max(3, baseReps - 1)
  if (setIndex > 0 && Math.random() < 0.35) return Math.max(3, baseReps - 1)
  return baseReps
}

function setCountForExercise(): number {
  return Math.random() < 0.55 ? 4 : 3
}

function buildSetsForExercise(
  template: ExerciseTemplate,
  weekProgress: number
): { reps: number; weight: number }[] {
  const n = setCountForExercise()
  const baseReps = targetRepsForWeek(template, weekProgress)
  const sets: { reps: number; weight: number }[] = []

  for (let i = 0; i < n; i += 1) {
    sets.push({
      reps: repsForSet(baseReps, i, n),
      weight: Math.max(2.5, targetWeightForWeek(template, weekProgress, i, n)),
    })
  }

  return sets
}

function dateForSlot(weekIdx: number, sessionIdx: number): Date {
  const dayFromToday = -41 + weekIdx * 7 + sessionIdx * 2
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + dayFromToday)
  return d
}

async function seed() {
  await prisma.set.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.workout.deleteMany()

  const weekCount = 6
  const sessionsPerWeek = 4

  for (let weekIdx = 0; weekIdx < weekCount; weekIdx += 1) {
    const weekProgress = weekCount > 1 ? weekIdx / (weekCount - 1) : 1

    for (let sessionIdx = 0; sessionIdx < sessionsPerWeek; sessionIdx += 1) {
      const workoutName = WORKOUT_NAMES[sessionIdx]
      const templates = TEMPLATES[workoutName]
      const date = dateForSlot(weekIdx, sessionIdx)

      await prisma.workout.create({
        data: {
          name: workoutName,
          date,
          exercises: {
            create: templates.map((template) => ({
              name: template.name,
              sets: {
                create: buildSetsForExercise(template, weekProgress),
              },
            })),
          },
        },
      })
    }
  }

  console.log(
    `Seeded ${weekCount * sessionsPerWeek} workouts (${weekCount} weeks × ${sessionsPerWeek} sessions) across the last 42 days.`
  )
}

async function main() {
  await seed()
}

main()
  .catch((error: unknown) => {
    console.error('Failed to seed database:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
