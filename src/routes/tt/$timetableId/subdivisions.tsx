import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useCollections } from '@/db-collections/providers/useCollections'

export const Route = createFileRoute('/tt/$timetableId/subdivisions')({
  component: RouteComponent,
})

function RouteComponent() {
  const { subdivisionCollection } = useCollections()
  const { timetableId } = Route.useParams()
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    subdivisionCollection.insert({
      id: nanoid(4),
      name,
      timetableId,
    })
    setName('')
  }

  return (
    <div>
      <h1>Add Subdivision</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Subdivision Name:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Subdivision</button>
      </form>
    </div>
  )
}
