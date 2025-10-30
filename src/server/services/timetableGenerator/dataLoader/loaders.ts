import type { PrismaClient } from "generated/prisma/client";
import type {
  GALecture,
  GATeacher,
  GASubdivision,
  GAClassroom,
  GASlot,
} from "../types";

export async function loadLectures(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GALecture[]> {
  const lectures = await prisma.lecture.findMany({
    where: { timetableId },
    include: {
      lectureSubdivisions: { include: { subdivision: true } },
      lectureClassrooms: { include: { classroom: true } },
      lectureSlots: { include: { slot: true } },
      subject: { include: { group: true } },
      teacher: { include: { slots: true } },
    },
  });

  return lectures.map((lecture) => ({
    id: lecture.id,
    teacherId: lecture.teacherId,
    subjectId: lecture.subjectId,
    timetableId: lecture.timetableId,
    count: lecture.count,
    duration: lecture.duration,
    createdAt: lecture.createdAt,
    subdivisions: lecture.lectureSubdivisions.map((ls) => ({
      id: ls.id,
      subdivisionId: ls.subdivisionId,
      lectureId: ls.lectureId,
    })),
    combinedClassrooms: lecture.lectureClassrooms.map((lc) => ({
      id: lc.id,
      classroomId: lc.classroomId,
      lectureId: lc.lectureId,
    })),
    lockedSlots: lecture.lectureSlots.map((ls) => ({
      id: ls.id,
      slotId: ls.slotId,
      lectureId: ls.lectureId,
      isLocked: ls.isLocked,
    })),
    subject: {
      id: lecture.subject.id,
      name: lecture.subject.name,
      groupId: lecture.subject.groupId,
      group: {
        id: lecture.subject.group.id,
        name: lecture.subject.group.name,
        allowSimultaneous: lecture.subject.group.allowSimultaneous,
        timetableId: lecture.subject.group.timetableId,
      },
    },
    teacher: {
      ...lecture.teacher,
      unavailableSlots: lecture.teacher.slots.map((slot) => ({
        id: slot.id,
        slotId: slot.slotId,
        teacherId: slot.teacherId,
      })),
    },
  }));
}

export async function loadTeachers(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GATeacher[]> {
  const teachers = await prisma.teacher.findMany({
    where: { timetableId },
    include: { slots: true },
  });

  return teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    timetableId: teacher.timetableId,
    dailyMaxHours: teacher.dailyMaxHours,
    weeklyMaxHours: teacher.weeklyMaxHours,
    unavailableSlots: teacher.slots.map((slot) => ({
      id: slot.id,
      slotId: slot.slotId,
      teacherId: slot.teacherId,
    })),
  }));
}

export async function loadSubdivisions(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GASubdivision[]> {
  const subdivisions = await prisma.subdivision.findMany({
    where: { timetableId },
    include: { subdivsionUnavailables: true },
  });

  return subdivisions.map((subdivision) => ({
    id: subdivision.id,
    name: subdivision.name,
    timetableId: subdivision.timetableId,
    unavailableSlots: subdivision.subdivsionUnavailables.map((slot) => ({
      id: slot.id,
      slotId: slot.slotId,
      subdivisionId: slot.subdivisionId,
      timetableId: slot.timetableId,
    })),
  }));
}

export async function loadClassrooms(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GAClassroom[]> {
  const classrooms = await prisma.classroom.findMany({
    where: { timetableId },
    include: { slots: true },
  });

  return classrooms.map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    timetableId: classroom.timetableId,
    unavailableSlots: classroom.slots.map((slot) => ({
      id: slot.id,
      slotId: slot.slotId,
      classroomId: slot.classroomId,
    })),
  }));
}

export async function loadSlots(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GASlot[]> {
  const slots = await prisma.slot.findMany({
    where: { timetableId },
    orderBy: [{ day: "asc" }, { number: "asc" }],
  });

  return slots.map((slot) => ({
    id: slot.id,
    day: slot.day,
    number: slot.number,
    timetableId: slot.timetableId,
    createdAt: slot.createdAt,
  }));
}
