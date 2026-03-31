'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Clock, Dumbbell, TrendingUp } from 'lucide-react'
import styles from './home.module.css'

interface SetItem {
  id: string
  reps: number
  weight: number
}

interface ExerciseItem {
  id: string
  name: string
  sets: SetItem[]
}

interface WorkoutItem {
  id: string
  name: string
  date: string
  exercises: ExerciseItem[]
}

function formatWorkoutDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function aggregateWorkouts(workouts: WorkoutItem[]) {
  const totalWorkouts = workouts.length
  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0)
  const totalSets = workouts.reduce(
    (sum, w) =>
      sum + w.exercises.reduce((es, ex) => es + ex.sets.length, 0),
    0
  )
  return { totalWorkouts, totalExercises, totalSets }
}

function epleyE1rm(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

function collectUniqueExerciseNames(workouts: WorkoutItem[]): string[] {
  const seen = new Set<string>()
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const name = exercise.name.trim()
      if (name) seen.add(name)
    }
  }
  return [...seen]
}

function maxE1rmForExercise(workouts: WorkoutItem[], exerciseName: string): number {
  let max = Number.NEGATIVE_INFINITY
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (exercise.name.trim() !== exerciseName) continue
      for (const setItem of exercise.sets) {
        const v = epleyE1rm(setItem.weight, setItem.reps)
        if (v > max) max = v
      }
    }
  }
  return max
}

interface Est1rmCardState {
  valueDisplay: string
  exerciseDisplay: string
}

function pickEst1rmCardState(workouts: WorkoutItem[]): Est1rmCardState {
  const names = collectUniqueExerciseNames(workouts)
  if (names.length === 0)
    return { valueDisplay: '—', exerciseDisplay: 'No data yet' }

  const pick = names[Math.floor(Math.random() * names.length)]
  const max = maxE1rmForExercise(workouts, pick)

  if (!Number.isFinite(max))
    return { valueDisplay: '—', exerciseDisplay: 'No data yet' }

  return {
    valueDisplay: `${max.toFixed(1)} kg`,
    exerciseDisplay: pick,
  }
}

export default function HomePage() {
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function load() {
      setIsLoading(true)
      try {
        const response = await fetch('/api/workouts', { method: 'GET' })
        const json = (await response.json()) as { workouts?: WorkoutItem[] }

        if (!isActive) return
        setWorkouts(Array.isArray(json.workouts) ? json.workouts : [])
      } catch {
        if (!isActive) return
        setWorkouts([])
      } finally {
        if (!isActive) return
        setIsLoading(false)
      }
    }

    load()

    return () => {
      isActive = false
    }
  }, [])

  const stats = useMemo(() => aggregateWorkouts(workouts), [workouts])
  const est1rmCard = useMemo(() => pickEst1rmCardState(workouts), [workouts])

  const recentWorkouts = useMemo(() => {
    const sorted = [...workouts].sort((a, b) => {
      const aTime = new Date(a.date).getTime()
      const bTime = new Date(b.date).getTime()
      return bTime - aTime
    })
    return sorted.slice(0, 3)
  }, [workouts])

  const statDisplay = (value: number) =>
    isLoading ? '—' : String(value)

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label="Introduction">
        <Dumbbell className={styles.heroIcon} size={48} strokeWidth={1.5} aria-hidden />
        <h1 className={styles.heroTitle}>GRIND</h1>
        <p className={styles.heroSubtitle}>Track your lifts. Own your progress.</p>
        <div className={styles.heroActions}>
          <Link href="/log" className={styles.btnPrimary}>
            Log Workout
          </Link>
          <Link href="/dashboard" className={styles.btnSecondary}>
            View Dashboard
          </Link>
        </div>
      </section>

      <section className={styles.statsSection} aria-label="Your stats">
        <div className={styles.statsHeader}>
          <TrendingUp className={styles.statsIcon} size={22} strokeWidth={2} aria-hidden />
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <p className={styles.statValue}>{statDisplay(stats.totalWorkouts)}</p>
            <p className={styles.statLabel}>Total Workouts</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>
              {isLoading ? '—' : est1rmCard.valueDisplay}
            </p>
            <p className={styles.est1rmExerciseName}>
              {isLoading ? 'No data yet' : est1rmCard.exerciseDisplay}
            </p>
            <p className={styles.est1rmLabel}>Est. 1RM</p>
            <p className={styles.est1rmNote}>refreshes each visit</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statValue}>{statDisplay(stats.totalSets)}</p>
            <p className={styles.statLabel}>Total Sets completed</p>
          </div>
        </div>
      </section>

      <section className={styles.recentSection} aria-label="Recent sessions">
        <div className={styles.recentHeadingRow}>
          <Clock size={16} strokeWidth={2} className={styles.recentHeadingIcon} aria-hidden />
          <h2 className={styles.recentHeading}>Recent Sessions</h2>
        </div>

        {!isLoading && workouts.length === 0 ? (
          <p className={styles.recentEmpty}>
            No sessions yet — log your first workout
          </p>
        ) : null}

        {!isLoading && recentWorkouts.length > 0 ? (
          <ul className={styles.recentList}>
            {recentWorkouts.map((workout) => {
              const n = workout.exercises.length
              const pill =
                n === 1 ? '1 exercise' : `${n} exercises`

              return (
                <li key={workout.id} className={styles.recentRow}>
                  <div className={styles.recentLeft}>
                    <p className={styles.recentName}>{workout.name}</p>
                    <p className={styles.recentDate}>{formatWorkoutDate(workout.date)}</p>
                  </div>
                  <span className={styles.exercisePill}>{pill}</span>
                </li>
              )
            })}
          </ul>
        ) : null}

        {isLoading ? (
          <p className={styles.recentEmpty}>Loading sessions…</p>
        ) : null}

        <div className={styles.seeAllRow}>
          <Link href="/history" className={styles.seeAll}>
            See all
          </Link>
        </div>
      </section>
    </div>
  )
}
