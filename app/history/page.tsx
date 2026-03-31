'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronDown, Dumbbell, Trash2 } from 'lucide-react'
import styles from './history.module.css'

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

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([])
  const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null)

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
          setErrorMessage(json.error ?? 'Could not load workouts.')
          return
        }

        if (!isActive) return
        setWorkouts(Array.isArray(json.workouts) ? json.workouts : [])
      } catch {
        if (!isActive) return
        setErrorMessage('Could not load workouts.')
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

  async function handleDelete(workoutId: string) {
    if (deletingWorkoutId) return

    setDeletingWorkoutId(workoutId)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      })
      const json = (await response.json()) as { error?: string }

      if (!response.ok) {
        setErrorMessage(json.error ?? 'Could not delete workout.')
        return
      }

      setWorkouts((prev) => prev.filter((workout) => workout.id !== workoutId))
      setExpandedWorkoutIds((prev) => prev.filter((id) => id !== workoutId))
    } catch {
      setErrorMessage('Could not delete workout.')
    } finally {
      setDeletingWorkoutId(null)
    }
  }

  function toggleExpanded(workoutId: string) {
    setExpandedWorkoutIds((prev) => {
      if (prev.includes(workoutId)) return prev.filter((id) => id !== workoutId)
      return [...prev, workoutId]
    })
  }

  const sortedWorkouts = [...workouts].sort((a, b) => {
    const aTime = new Date(a.date).getTime()
    const bTime = new Date(b.date).getTime()
    return bTime - aTime
  })

  const sessionCount = workouts.length
  const sessionLabel =
    sessionCount === 1 ? '1 session logged' : `${sessionCount} sessions logged`

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Workout History</h1>
        <p className={styles.pageSubtitle}>
          {isLoading ? 'Loading…' : sessionLabel}
        </p>
      </header>

      {errorMessage ? (
        <p className={styles.alert} role="alert">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? <p className={styles.loadingText}>Loading workouts…</p> : null}

      {!isLoading && workouts.length === 0 ? (
        <div className={styles.emptyState}>
          <Dumbbell className={styles.emptyIcon} size={48} strokeWidth={1.5} aria-hidden />
          <p className={styles.emptyTitle}>No workouts logged yet</p>
          <p className={styles.emptyHint}>Start by logging your first workout</p>
          <Link href="/log" className={styles.emptyCta}>
            Log Workout
          </Link>
        </div>
      ) : null}

      {!isLoading && workouts.length > 0 ? (
        <ul className={styles.workoutList}>
          {sortedWorkouts.map((workout) => {
            const isExpanded = expandedWorkoutIds.includes(workout.id)
            const exerciseCount = workout.exercises.length
            const exerciseLabel =
              exerciseCount === 1 ? '1 exercise' : `${exerciseCount} exercises`

            return (
              <li key={workout.id} className={styles.workoutCard}>
                <div className={styles.cardHeader}>
                  <button
                    type="button"
                    className={styles.headerToggle}
                    onClick={() => toggleExpanded(workout.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className={styles.cardHeaderLeft}>
                      <h2 className={styles.workoutName}>{workout.name}</h2>
                      <p className={styles.workoutDate}>{formatWorkoutDate(workout.date)}</p>
                    </div>
                    <span className={styles.exercisePill}>{exerciseLabel}</span>
                  </button>
                  <div className={styles.cardHeaderRight}>
                    <button
                      type="button"
                      disabled={Boolean(deletingWorkoutId)}
                      onClick={() => handleDelete(workout.id)}
                      className={styles.deleteBtn}
                      aria-label={`Delete ${workout.name}`}
                    >
                      <Trash2 size={18} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      className={styles.chevronBtn}
                      onClick={() => toggleExpanded(workout.id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Collapse workout' : 'Expand workout'}
                    >
                      <ChevronDown
                        size={20}
                        strokeWidth={2}
                        className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>

                <div
                  className={`${styles.expandable} ${isExpanded ? styles.expandableOpen : ''}`}
                >
                  <div className={styles.expandInner}>
                    {workout.exercises.length > 0 ? (
                      workout.exercises.map((exercise) => (
                        <div key={exercise.id} className={styles.exerciseBlock}>
                          <p className={styles.exerciseName}>{exercise.name}</p>
                          <table className={styles.setsTable}>
                            <thead>
                              <tr>
                                <th>Set</th>
                                <th>Reps</th>
                                <th>Weight</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exercise.sets.map((setRow, index) => (
                                <tr key={setRow.id}>
                                  <td className={styles.setIndexCell}>{index + 1}</td>
                                  <td className={styles.repsCell}>{setRow.reps}</td>
                                  <td className={styles.weightCell}>{setRow.weight}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))
                    ) : (
                      <p className={styles.noExercises}>No exercises logged.</p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
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
