import { parseCsvData, removeDuplicates, validateCsvData } from "./utils";
import type { Prisma } from "__generated__/prisma/client";
import type { ClassroomData } from "./csvHeaders";
import { prisma } from "@/server/prisma";

export async function uploadClassroomData(
  csvData: string,
  timetableId: number,
) {
  const parsedCsv = await parseCsvData<ClassroomData>(csvData);
  if (!validateCsvData(parsedCsv, "classroom")) {
    return false;
  }
  let classroomCreate: Prisma.ClassroomCreateManyInput[] = [];
  for (const row of parsedCsv.data) {
    const { classroom_name: name } = row;
    classroomCreate.push({
      name,
      timetableId: timetableId,
    });
  }
  classroomCreate = removeDuplicates(classroomCreate);
  await prisma.classroom.createMany({
    data: classroomCreate,
  });
  return true;
}
