import {
  joinSubdivisionName,
  parseCsvData,
  removeDuplicates,
  validateCsvData,
} from "./utils";
import type { Prisma } from "generated/prisma/client";
import type { BatchAndSubdivisionData } from "./csvHeaders";
import { prisma } from "@/server/prisma";

export async function uploadSubdivsionData(
  csvData: string,
  timetableId: string,
) {
  const parsedCsv = await parseCsvData<BatchAndSubdivisionData>(csvData);
  if (!validateCsvData(parsedCsv, "batchAndSubdivision")) return false;

  // Creating subdivisions
  let subdivisionCreate: Prisma.SubdivisionCreateManyInput[] = [];
  for (const row of parsedCsv.data) {
    const {
      batch_name: batchName,
      department_name: departmentName,
      // division_name is not required as it already a part of subdivision name
      subdivision_name: subdivisionName,
    } = row;

    // creating a subdivision name
    const joinedName = joinSubdivisionName({
      batchName,
      departmentName,
      subdivisionName,
    });

    subdivisionCreate.push({
      name: joinedName,
      timetableId,
    });
  }
  subdivisionCreate = removeDuplicates(subdivisionCreate);
  await prisma.subdivision.createMany({
    data: subdivisionCreate,
  });
  return true;
}
export async function getSubdivisionsByTimetable(timetableId: string) {
  const subdivisions = await prisma.subdivision.findMany({
    where: { timetableId },
  });
  return subdivisions;
}
