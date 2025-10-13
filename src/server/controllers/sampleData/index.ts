import path from "node:path";
import fs from "node:fs/promises";
import { uploadClassroomData } from "./classrooms";
import { uploadTimetableData } from "./lectures";
import { uploadSlotsData } from "./slots";
import { uploadSubdivsionData } from "./subdivisions";
import { uploadSubjectAndTeacherData } from "./subjectAndTeacher";
import { DIRNAME } from "./DIRNAME";
import { prisma } from "@/server/prisma";

async function sampleDataUpload(timetableName: string, organizationId: string) {
  const timetable = await prisma.timetable.upsert({
    create: {
      name: timetableName,
      organizationId,
    },
    update: {},
    where: {
      name_organizationId: {
        name: timetableName,
        organizationId,
      },
    },
  });

  /**
   * Subdivision data
   */
  const batchAndSubData = await fs.readFile(
    path.join(DIRNAME, "./SAMPLE_DATA/batch_and_subdivision.csv"),
    "utf8",
  );
  await uploadSubdivsionData(batchAndSubData, timetable.id);

  /**
   * Slot data
   */
  const slotData = await fs.readFile(
    path.join(DIRNAME, "./SAMPLE_DATA/slot.csv"),
    "utf8",
  );
  await uploadSlotsData(slotData, timetable.id);

  /**
   * Classroom data
   */
  const classroomData = await fs.readFile(
    path.join(DIRNAME, "./SAMPLE_DATA/classroom.csv"),
    "utf8",
  );
  await uploadClassroomData(classroomData, timetable.id);

  /**
   * Subject and teacher data
   */
  const subAndTeacherData = await fs.readFile(
    path.join(DIRNAME, "./SAMPLE_DATA/subject_and_teacher.csv"),
    "utf8",
  );
  await uploadSubjectAndTeacherData(subAndTeacherData, timetable.id);

  /**
   * Timetable data
   */
  const timetableData = await fs.readFile(
    path.join(DIRNAME, "./SAMPLE_DATA/timetable.csv"),
    "utf8",
  );
  await uploadTimetableData(timetableData, timetable.id);
  console.log(`All data for ${timetableName} uploaded successfully`);
}

export default sampleDataUpload;
