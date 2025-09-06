import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useCollections } from '@/db-collections/providers/useCollections'

export const Route = createFileRoute('/tt/$timetableId/teachers')({
  component: RouteComponent,
})

function RouteComponent() {
  const { teacherCollection } = useCollections()
  const { timetableId } = Route.useParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    teacherCollection.insert({
      id: nanoid(4),
      name,
      email,
      timetableId,
    })
    setName('')
    setEmail('')
  }

  return (
    <div>
      <h1>Add Teacher</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Teacher</button>
      </form>
    </div>
  )
}
