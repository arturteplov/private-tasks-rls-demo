

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import './App.css'

type Task = {
  id: string
  user_id: string
  title: string
  completed: boolean
  created_at: string
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      loadTasks()
    } else {
      setTasks([])
    }
  }, [session])

  async function signUp() {
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    if (data.session) {
      setMessage('Account created and signed in.')
    } else {
      setMessage('Account created. Check email confirmation settings.')
    }
  }

  async function signIn() {
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setMessage('')
  }

  async function loadTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setTasks(data ?? [])
  }

  async function addTask() {
    if (!session || !newTitle.trim()) return

    const { error } = await supabase.from('tasks').insert({
      user_id: session.user.id,
      title: newTitle.trim(),
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setNewTitle('')
    await loadTasks()
  }

  async function toggleTask(task: Task) {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadTasks()
  }

  async function deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadTasks()
  }

  if (!session) {
    return (
      <main className="container">
        <h1>Private Tasks</h1>
        <p className="subtitle">RLS security demonstration</p>

        <div className="card">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="actions">
            <button onClick={signIn}>Sign in</button>
            <button className="secondary" onClick={signUp}>
              Create account
            </button>
          </div>

          {message && <p>{message}</p>}
        </div>
      </main>
    )
  }

  return (
    <main className="container">
      <h1>Private Tasks</h1>

      <div className="userBar">
        <div>
          Signed in as <strong>{session.user.email}</strong>
          <div className="userId">
            User ID: {session.user.id}
          </div>
        </div>

        <button className="secondary" onClick={signOut}>
          Sign out
        </button>
      </div>

      <div className="card">
        <h2>Create task</h2>

        <div className="actions">
          <input
            placeholder="Task title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTask()
            }}
          />

          <button onClick={addTask}>Add</button>
        </div>
      </div>

      <div className="card">
        <div className="tasksHeader">
          <h2>Tasks visible to this user</h2>
          <button className="secondary" onClick={loadTasks}>
            Reload
          </button>
        </div>

        {tasks.length === 0 && <p>No tasks.</p>}

        {tasks.map((task) => (
          <div className="task" key={task.id}>
            <div>
              <strong>
                {task.completed ? '✓ ' : ''}
                {task.title}
              </strong>

              <div className="owner">
                Owner: {task.user_id}
              </div>
            </div>

            <div className="actions">
              <button
                className="secondary"
                onClick={() => toggleTask(task)}
              >
                Toggle
              </button>

              <button
                className="danger"
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {message && <p>{message}</p>}
      </div>
    </main>
  )
}

