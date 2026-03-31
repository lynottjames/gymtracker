'use client'

import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import styles from './log.module.css'

function newRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function LogPage() {
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDate, setWorkoutDate] = useState(() => formatDateInputValue(new Date()))
  const [exercises, setExercises] = useState<ExerciseForm[]>(() => [
    {
      id: newRowId(),
      name: '',
      sets: [{ id: newRowId(), reps: '', weight: '' }],
    },
  ])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function addExercise() {
    setExercises((prev) => [
      ...prev,
      {
        id: newRowId(),
        name: '',
        sets: [{ id: newRowId(), reps: '', weight: '' }],
      },
    ])
  }

  function removeExercise(exerciseId: string) {
    setExercises((prev) => (prev.length <= 1 ? prev : prev.filter((e) => e.id !== exerciseId)))
  }

  function updateExerciseName(exerciseId: string, name: string) {
    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, name } : e))
    )
  }

  function addSet(exerciseId: string) {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: [...e.sets, { id: newRowId(), reps: '', weight: '' }] }
          : e
      )
    )
  }

  function removeSet(exerciseId: string, setId: string) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exerciseId) return e
        const nextSets = e.sets.length <= 1 ? e.sets : e.sets.filter((s) => s.id !== setId)
        return { ...e, sets: nextSets }
      })
    )
  }

  function updateSet(
    exerciseId: string,
    setId: string,
    field: 'reps' | 'weight',
    value: string
  ) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exerciseId) return e
        return {
          ...e,
          sets: e.sets.map((s) =>
            s.id === setId ? { ...s, [field]: value } : s
          ),
        }
      })
    )
  }

  function parseExerciseSets(
    sets: SetForm[]
  ): { ok: true; sets: { reps: number; weight: number }[] } | { ok: false; message: string } {
    const out: { reps: number; weight: number }[] = []

    for (let i = 0; i < sets.length; i += 1) {
      const row = sets[i]
      const repsTrim = row.reps.trim()
      const weightTrim = row.weight.trim()

      if (repsTrim === '' && weightTrim === '') continue

      if (repsTrim === '' || weightTrim === '')
        return {
          ok: false,
          message: `Set ${i + 1}: enter both reps and weight, or leave the row empty.`,
        }

      const reps = Number.parseInt(repsTrim, 10)
      const weight = Number.parseFloat(weightTrim)

      if (!Number.isFinite(reps) || !Number.isInteger(reps) || reps < 0)
        return { ok: false, message: `Set ${i + 1}: reps must be a non-negative whole number.` }

      if (!Number.isFinite(weight))
        return { ok: false, message: `Set ${i + 1}: weight must be a number.` }

      out.push({ reps, weight })
    }

    return { ok: true, sets: out }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!workoutName.trim()) {
      setSubmitError('Enter a workout name.')
      return
    }

    if (!workoutDate) {
      setSubmitError('Choose a workout date.')
      return
    }

    for (let i = 0; i < exercises.length; i += 1) {
      const ex = exercises[i]
      if (!ex.name.trim()) {
        setSubmitError(`Exercise ${i + 1}: enter a name or remove the exercise.`)
        return
      }

      const parsed = parseExerciseSets(ex.sets)
      if (!parsed.ok) {
        setSubmitError(`Exercise “${ex.name.trim() || `#${i + 1}`}”: ${parsed.message}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      const workoutRes = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workoutName.trim(),
          date: workoutDate,
        }),
      })

      const workoutJson = (await workoutRes.json()) as {
        workout?: { id: string }
        error?: string
      }

      if (!workoutRes.ok || !workoutJson.workout?.id) {
        setSubmitError(workoutJson.error ?? 'Could not create workout.')
        return
      }

      const workoutId = workoutJson.workout.id

      for (let i = 0; i < exercises.length; i += 1) {
        const ex = exercises[i]
        const parsed = parseExerciseSets(ex.sets)
        if (!parsed.ok) {
          setSubmitError(`Exercise “${ex.name}”: ${parsed.message}`)
          return
        }

        const exRes = await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: ex.name.trim(),
            workoutId,
            sets: parsed.sets,
          }),
        })

        const exJson = (await exRes.json()) as { error?: string }

        if (!exRes.ok) {
          setSubmitError(
            exJson.error ??
              `Could not save exercise “${ex.name.trim()}”. The workout was created; you can add exercises from the API or try again.`
          )
          return
        }
      }

      setWorkoutName('')
      setWorkoutDate(formatDateInputValue(new Date()))
      setExercises([
        {
          id: newRowId(),
          name: '',
          sets: [{ id: newRowId(), reps: '', weight: '' }],
        },
      ])
      setSubmitSuccess(true)
    } catch {
      setSubmitError('Something went wrong. Check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.pageTitle}>Log Workout</h1>
        <p className={styles.pageSubdate}>
          {new Date(workoutDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </header>

      <form id="log-workout-form" onSubmit={handleSubmit}>
        <section className={styles.formSection}>
          <label className={styles.fieldLabel} htmlFor="workout-date">
            Workout date
          </label>
          <input
            id="workout-date"
            type="date"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className={styles.textInput}
          />
        </section>

        <section className={styles.formSection}>
          <label className={styles.fieldLabel} htmlFor="workout-name">
            Workout name
          </label>
          <input
            id="workout-name"
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g. Push day"
            className={styles.textInput}
          />
        </section>

        <section className={styles.formSection}>
          <ul className={styles.exerciseList}>
            {exercises.map((exercise, exerciseIndex) => (
              <li key={exercise.id} className={styles.exerciseCard}>
                <div className={styles.exerciseCardHeader}>
                  <span className={styles.exerciseBadge}>Exercise {exerciseIndex + 1}</span>
                  {exercises.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.id)}
                      className={styles.removeLink}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className={styles.exerciseNameBlock}>
                  <label className={styles.fieldLabel} htmlFor={`exercise-name-${exercise.id}`}>
                    Exercise name
                  </label>
                  <input
                    id={`exercise-name-${exercise.id}`}
                    type="text"
                    value={exercise.name}
                    onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                    placeholder="e.g. Bench press"
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.setHeaders}>
                  <span className={styles.setHeaderCell}>Set</span>
                  <span className={styles.setHeaderCell}>Reps</span>
                  <span className={styles.setHeaderCell}>Weight (kg)</span>
                  <span className={styles.setHeaderCell} aria-hidden />
                </div>

                {exercise.sets.map((setRow, setIndex) => (
                  <div key={setRow.id} className={styles.setRow}>
                    <span className={styles.setIndex}>{setIndex + 1}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={setRow.reps}
                      onChange={(e) =>
                        updateSet(exercise.id, setRow.id, 'reps', e.target.value)
                      }
                      className={styles.setInput}
                      aria-label={`Set ${setIndex + 1} reps`}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={setRow.weight}
                      onChange={(e) =>
                        updateSet(exercise.id, setRow.id, 'weight', e.target.value)
                      }
                      className={styles.setInput}
                      aria-label={`Set ${setIndex + 1} weight kg`}
                    />
                    {exercise.sets.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeSet(exercise.id, setRow.id)}
                        className={styles.setRemove}
                      >
                        Remove
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addSet(exercise.id)}
                  className={styles.addSetBtn}
                >
                  Add Set
                </button>
              </li>
            ))}
          </ul>

          <button type="button" onClick={addExercise} className={styles.addExerciseBtn}>
            <Plus size={18} strokeWidth={2} aria-hidden />
            Add Exercise
          </button>
        </section>

        {submitError ? (
          <p className={`${styles.alert} ${styles.alertError}`} role="alert">
            {submitError}
          </p>
        ) : null}

        {submitSuccess ? (
          <p className={`${styles.alert} ${styles.alertSuccess}`} role="status">
            Workout saved.
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className={styles.saveWorkout}>
          {isSubmitting ? 'Saving…' : 'Save Workout'}
        </button>
      </form>
    </div>
  )
}

interface SetForm {
  id: string
  reps: string
  weight: string
}

interface ExerciseForm {
  id: string
  name: string
  sets: SetForm[]
}
