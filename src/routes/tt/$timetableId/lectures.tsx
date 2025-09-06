import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useLiveQuery } from '@tanstack/react-db'
import { useCollections } from '@/db-collections/providers/useCollections'

export const Route = createFileRoute('/tt/$timetableId/lectures')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    lectureCollection,
    teacherCollection,
    subjectCollection,
    subdivisionCollection,
    classroomCollection,
    lectureSubdivisionCollection,
    lectureClassroomCollection
  } = useCollections()
  const { timetableId } = Route.useParams()

  const [teacherId, setTeacherId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [count, setCount] = useState(1)
  const [duration, setDuration] = useState(1)
  const [selectedLectureId, setSelectedLectureId] = useState('')
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState('')
  const [selectedClassroomId, setSelectedClassroomId] = useState('')

  const { data: teachers } = useLiveQuery((q) =>
    q.from({ teacher: teacherCollection })
  )

  const { data: subjects } = useLiveQuery((q) =>
    q.from({ subject: subjectCollection })
  )

  const { data: subdivisions } = useLiveQuery((q) =>
    q.from({ subdivision: subdivisionCollection })
  )

  const { data: classrooms } = useLiveQuery((q) =>
    q.from({ classroom: classroomCollection })
  )

  const { data: lectures } = useLiveQuery((q) =>
    q.from({ lecture: lectureCollection })
  )

  const handleLectureSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    lectureCollection.insert({
      id: nanoid(4),
      teacherId,
      subjectId,
      timetableId,
      count,
      duration,
      createdAt: new Date(),
    })
    setTeacherId('')
    setSubjectId('')
    setCount(1)
    setDuration(1)
  }

  const handleSubdivisionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLectureId || !selectedSubdivisionId) return
    lectureSubdivisionCollection.insert({
      id: nanoid(4),
      lectureId: selectedLectureId,
      subdivisionId: selectedSubdivisionId,
    })
    setSelectedSubdivisionId('')
  }

  const handleClassroomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLectureId || !selectedClassroomId) return
    lectureClassroomCollection.insert({
      id: nanoid(4),
      lectureId: selectedLectureId,
      classroomId: selectedClassroomId,
    })
    setSelectedClassroomId('')
  }

  return (
    <div>
      <h1>Manage Lectures</h1>

      <div>
        <h2>Create Lecture</h2>
        <form onSubmit={handleLectureSubmit}>
          <div>
            <label htmlFor="teacherSelect">Select Teacher:</label>
            <select
              id="teacherSelect"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
            >
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subjectSelect">Select Subject:</label>
            <select
              id="subjectSelect"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="count">Count:</label>
            <input
              id="count"
              type="number"
              min="1"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label htmlFor="duration">Duration:</label>
            <input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
          </div>
          <button type="submit">Create Lecture</button>
        </form>
      </div>

      <div>
        <h2>Assign Subdivision to Lecture</h2>
        <form onSubmit={handleSubdivisionSubmit}>
          <div>
            <label htmlFor="lectureSelect">Select Lecture:</label>
            <select
              id="lectureSelect"
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              required
            >
              <option value="">Select a lecture</option>
              {lectures.map((lecture) => (
                <option key={lecture.id} value={lecture.id}>
                  Lecture {lecture.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subdivisionSelect">Select Subdivision:</label>
            <select
              id="subdivisionSelect"
              value={selectedSubdivisionId}
              onChange={(e) => setSelectedSubdivisionId(e.target.value)}
              required
            >
              <option value="">Select a subdivision</option>
              {subdivisions.map((subdivision) => (
                <option key={subdivision.id} value={subdivision.id}>
                  {subdivision.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Assign Subdivision</button>
        </form>
      </div>

      <div>
        <h2>Assign Classroom to Lecture</h2>
        <form onSubmit={handleClassroomSubmit}>
          <div>
            <label htmlFor="lectureSelect2">Select Lecture:</label>
            <select
              id="lectureSelect2"
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              required
            >
              <option value="">Select a lecture</option>
              {lectures.map((lecture) => (
                <option key={lecture.id} value={lecture.id}>
                  Lecture {lecture.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="classroomSelect">Select Classroom:</label>
            <select
              id="classroomSelect"
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              required
            >
              <option value="">Select a classroom</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Assign Classroom</button>
        </form>
      </div>
    </div>
  )
}
