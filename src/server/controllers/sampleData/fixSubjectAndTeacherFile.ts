import path from "node:path";
import fs from "node:fs/promises";
import Papa from "papaparse";
import { parseCsvData, validateCsvData } from "./utils";
import { DIRNAME } from "./DIRNAME";
import type { SubjectAndTeacherData } from "./csvHeaders";

/**
 * This function fixes the teacher_name field in the subject_and_teacher.csv file
 * If the same email has been mapped to multiple teachers, it will
 * replace the teacher_name if the name first found.
 */
export async function fixSubjectAndTeacherFile() {
  const csvData = await fs.readFile(
    path.join(DIRNAME, "./SAMPLE_DATA/subject_and_teacher.csv"),
    "utf8",
  );
  const parsedCsv = await parseCsvData<SubjectAndTeacherData>(csvData);
  if (!validateCsvData(parsedCsv, "subjectAndTeacher")) {
    return false;
  }
  if (!parsedCsv.data[0]) throw new Error("Parsed CSV was empty");
  const emailNameMapping: Record<string, string> = {};

  for (const row of parsedCsv.data) {
    if (!emailNameMapping[row.teacher_email])
      emailNameMapping[row.teacher_email] = row.teacher_name;
  }

  const fixedData = parsedCsv.data.map((row) => {
    return {
      ...row,
      teacher_name: emailNameMapping[row.teacher_email],
    };
  });

  const unparsedString = Papa.unparse({
    data: fixedData,
    fields: Object.keys(parsedCsv.data[0]),
  });

  await fs.writeFile(
    path.join(DIRNAME, "./SAMPLE_DATA/fixed_subject_and_teacher.csv"),
    unparsedString,
    "utf8",
  );
  console.log("Written successfully");
}
