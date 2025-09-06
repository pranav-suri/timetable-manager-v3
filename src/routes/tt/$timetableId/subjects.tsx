import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useLiveQuery } from '@tanstack/react-db'
import { useCollections } from '@/db-collections/providers/useCollections'

export const Route = createFileRoute('/tt/$timetableId/subjects')({
  component: RouteComponent,
})

function RouteComponent() {
  const { groupCollection, subjectCollection } = useCollections()
  const { timetableId } = Route.useParams()
  const [groupName, setGroupName] = useState('')
  const [allowSimultaneous, setAllowSimultaneous] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')

  const { data: groups } = useLiveQuery((q) =>
    q.from({ group: groupCollection })
  )

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    groupCollection.insert({
      id: nanoid(4),
      name: groupName,
      allowSimultaneous,
      timetableId,
    })
    setGroupName('')
    setAllowSimultaneous(false)
  }

  const handleSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroupId) return
    subjectCollection.insert({
      id: nanoid(4),
      name: subjectName,
      groupId: selectedGroupId,
    })
    setSubjectName('')
  }

  return (
    <div>
      <h1>Manage Groups and Subjects</h1>

      <div>
        <h2>Add Group</h2>
        <form onSubmit={handleGroupSubmit}>
          <div>
            <label htmlFor="groupName">Group Name:</label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="allowSimultaneous">Allow Simultaneous:</label>
            <input
              id="allowSimultaneous"
              type="checkbox"
              checked={allowSimultaneous}
              onChange={(e) => setAllowSimultaneous(e.target.checked)}
            />
          </div>
          <button type="submit">Add Group</button>
        </form>
      </div>

      <div>
        <h2>Add Subject</h2>
        <form onSubmit={handleSubjectSubmit}>
          <div>
            <label htmlFor="subjectName">Subject Name:</label>
            <input
              id="subjectName"
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="groupSelect">Select Group:</label>
            <select
              id="groupSelect"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              required
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Add Subject</button>
        </form>
      </div>
    </div>
  )
}
