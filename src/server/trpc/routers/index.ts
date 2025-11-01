import { createTRPCRouter } from "../init";
import { authRouter } from "./authRouter";
import { autoLecturesRouter } from "./autoLecturesRouter";
import { chatbotRouter } from "./chatbotRouter";
import { classroomsRouter } from "./classroomsRouter";
import { todosRouter } from "./demo/todosRouter";
import { generateRouter } from "./generateRouter";
import { generationConfigRouter } from "./generationConfigRouter";
import { groupsRouter } from "./groupsRouter";
import { lectureSlotsRouter } from "./lectureSlotsRouter";
import { lecturesRouter } from "./lecturesRouter";
import { slotsRouter } from "./slotsRouter";
import { subjectsRouter } from "./subjectsRouter";
import { subdivisionsRouter } from "./subdivisionsRouter";
import { teachersRouter } from "./teachersRouter";
import { timetableRouter } from "./timetableRouter";
import { lectureClassroomsRouter } from "./lectureClassroomsRouter";
import { lectureSubdivisionsRouter } from "./lectureSubdivisionsRouter";
import { subjectClassroomsRouter } from "./subjectClassroomsRouter";
import { subjectTeachersRouter } from "./subjectTeachersRouter";
import { classroomUnavailabilitiesRouter } from "./classroomUnavailabilitiesRouter";
import { teacherUnavailabilitiesRouter } from "./teacherUnavailabilitiesRouter";
import { subdivisionUnavailabilitiesRouter } from "./subdivisionUnavailabilitiesRouter";

export const trpcRouter = createTRPCRouter({
  auth: authRouter,
  autoLectures: autoLecturesRouter,
  chatbot: chatbotRouter,
  classrooms: classroomsRouter,
  classroomUnavailabilities: classroomUnavailabilitiesRouter,
  generate: generateRouter,
  generationConfig: generationConfigRouter,
  groups: groupsRouter,
  lectureSlots: lectureSlotsRouter,
  lectures: lecturesRouter,
  lectureClassrooms: lectureClassroomsRouter,
  lectureSubdivisions: lectureSubdivisionsRouter,
  slots: slotsRouter,
  subjects: subjectsRouter,
  subjectClassrooms: subjectClassroomsRouter,
  subjectTeachers: subjectTeachersRouter,
  subdivisions: subdivisionsRouter,
  subdivisionUnavailabilities: subdivisionUnavailabilitiesRouter,
  teachers: teachersRouter,
  teacherUnavailabilities: teacherUnavailabilitiesRouter,
  timetable: timetableRouter,
  todos: todosRouter,
});
export type TRPCRouter = typeof trpcRouter;
