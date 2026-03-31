'use client'

import { useEffect, useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadWorkouts() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await fetch('/api/workouts', { method: 'GET' })
        const json = (await response.json()) as {
          workouts?: WorkoutItem[]
          error?: string
        }

        if (!response.ok) {
          if (!isActive) return
          setErrorMessage(json.error ?? 'Could not load dashboard data.')
          return
        }

        if (!isActive) return
        setWorkouts(Array.isArray(json.workouts) ? json.workouts : [])
      } catch {
        if (!isActive) return
        setErrorMessage('Could not load dashboard data.')
      } finally {
        if (!isActive) return
        setIsLoading(false)
      }
    }

    loadWorkouts()

    return () => {
      isActive = false
    }
  }, [])

  const volumeSeries = useMemo(() => buildVolumeSeries({ workouts }), [workouts])
  const personalBests = useMemo(() => buildPersonalBests({ workouts }), [workouts])
  const dashboardStats = useMemo(() => buildDashboardStats({ workouts }), [workouts])
  const est1rmCard = useMemo(() => pickEst1rmCardState({ workouts }), [workouts])

  return (
    <>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      {errorMessage ? (
        <p className={styles.alert} role="alert">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? <p className={styles.muted}>Loading dashboard…</p> : null}

      {!isLoading ? (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Key metrics</h2>
            <div className={styles.statGrid}>
              <article className={styles.statCard}>
                <p className={styles.statNumber}>{dashboardStats.totalWorkouts}</p>
                <p className={styles.statLabel}>Total workouts</p>
              </article>
              <article className={styles.statCard}>
                <p className={styles.statNumber}>{est1rmCard.valueDisplay}</p>
                <p className={styles.est1rmExerciseName}>{est1rmCard.exerciseDisplay}</p>
                <p className={styles.est1rmLabel}>Est. 1RM</p>
                <p className={styles.est1rmNote}>refreshes each visit</p>
              </article>
              <article className={styles.statCard}>
                <p className={styles.statNumber}>
                  {dashboardStats.currentStreak}
                  <span
                    style={{
                      fontSize: '0.55em',
                      fontWeight: 700,
                      marginLeft: '0.2em',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent)',
                    }}
                  >
                    days
                  </span>
                </p>
                <p className={styles.statLabel}>Current streak</p>
              </article>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Volume over time</h2>
            <div className={styles.card}>
              {volumeSeries.length > 0 ? (
                <div className={styles.chartWrap}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={volumeSeries} style={{ background: 'transparent' }}>
                      <XAxis
                        dataKey="dateLabel"
                        stroke="var(--text-muted)"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      />
                      <YAxis
                        stroke="var(--text-muted)"
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fontSize: 12,
                          fill: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)' }} />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'var(--accent)' }}
                        activeDot={{ r: 5, fill: 'var(--accent)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className={styles.muted}>No workout volume data yet.</p>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Personal bests</h2>
            <div className={styles.card}>
              {personalBests.length > 0 ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Exercise</th>
                        <th>Best weight</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personalBests.map((item) => (
                        <tr key={item.exerciseName}>
                          <td>{item.exerciseName}</td>
                          <td className={styles.weightCell}>{item.bestWeight}</td>
                          <td>{formatPbDate(item.bestDateRaw)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.muted}>No personal bests yet.</p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ value?: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value
  if (value === undefined) return null

  return (
    <div className={styles.tooltipRoot}>
      <div className={styles.tooltipLabel}>{label}</div>
      <div className={styles.tooltipValue}>{value}</div>
    </div>
  )
}

function buildVolumeSeries({ workouts }: { workouts: WorkoutItem[] }): VolumePoint[] {
  const sorted = [...workouts].sort((a, b) => {
    const aTime = new Date(a.date).getTime()
    const bTime = new Date(b.date).getTime()
    return aTime - bTime
  })

  return sorted.map((workout) => {
    const volume = getWorkoutVolume({ workout })

    return {
      workoutId: workout.id,
      dateLabel: formatDateLabel({ value: workout.date }),
      volume: Number(volume.toFixed(2)),
    }
  })
}

function getWorkoutVolume({ workout }: { workout: WorkoutItem }): number {
  return workout.exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce(
      (sum, setItem) => sum + setItem.weight * setItem.reps,
      0
    )
    return total + exerciseVolume
  }, 0)
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

function maxE1rmForExercise({
  workouts,
  exerciseName,
}: {
  workouts: WorkoutItem[]
  exerciseName: string
}): number {
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

function pickEst1rmCardState({ workouts }: { workouts: WorkoutItem[] }): Est1rmCardState {
  const names = collectUniqueExerciseNames(workouts)
  if (names.length === 0)
    return { valueDisplay: '—', exerciseDisplay: 'No data yet' }

  const pick = names[Math.floor(Math.random() * names.length)]
  const max = maxE1rmForExercise({ workouts, exerciseName: pick })

  if (!Number.isFinite(max))
    return { valueDisplay: '—', exerciseDisplay: 'No data yet' }

  return {
    valueDisplay: `${max.toFixed(1)} kg`,
    exerciseDisplay: pick,
  }
}

function buildPersonalBests({ workouts }: { workouts: WorkoutItem[] }): PersonalBestRow[] {
  const map = new Map<string, { bestWeight: number; bestDateRaw: string }>()

  for (const workout of workouts) {
    const workoutDate = workout.date
    for (const exercise of workout.exercises) {
      const key = exercise.name.trim()
      if (!key) continue

      for (const setItem of exercise.sets) {
        const prev = map.get(key)
        if (prev === undefined || setItem.weight > prev.bestWeight) {
          map.set(key, { bestWeight: setItem.weight, bestDateRaw: workoutDate })
        }
      }
    }
  }

  return [...map.entries()]
    .map(([exerciseName, data]) => ({
      exerciseName,
      bestWeight: data.bestWeight,
      bestDateRaw: data.bestDateRaw,
    }))
    .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName))
}

function formatDateLabel({ value }: { value: string }): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatPbDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatIsoDate({ value }: { value: Date }): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDashboardStats({ workouts }: { workouts: WorkoutItem[] }): DashboardStats {
  const totalWorkouts = workouts.length
  const totalVolume = workouts.reduce(
    (sum, workout) => sum + getWorkoutVolume({ workout }),
    0
  )
  const currentStreak = getCurrentStreakDays({ workouts })

  return {
    totalWorkouts,
    totalVolume: Number(totalVolume.toFixed(2)),
    currentStreak,
  }
}

function getCurrentStreakDays({ workouts }: { workouts: WorkoutItem[] }): number {
  const uniqueDays = new Set<string>()

  for (const workout of workouts) {
    const date = new Date(workout.date)
    if (Number.isNaN(date.getTime())) continue
    uniqueDays.add(formatIsoDate({ value: date }))
  }

  if (uniqueDays.size === 0) return 0

  const sorted = [...uniqueDays].sort((a, b) => (a < b ? -1 : 1))
  let streak = 1

  for (let i = sorted.length - 1; i > 0; i -= 1) {
    const current = new Date(sorted[i])
    const previous = new Date(sorted[i - 1])
    const diffDays = Math.round(
      (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays !== 1) break
    streak += 1
  }

  return streak
}

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

interface VolumePoint {
  workoutId: string
  dateLabel: string
  volume: number
}

interface PersonalBestRow {
  exerciseName: string
  bestWeight: number
  bestDateRaw: string
}

interface DashboardStats {
  totalWorkouts: number
  totalVolume: number
  currentStreak: number
}

interface Est1rmCardState {
  valueDisplay: string
  exerciseDisplay: string
}
