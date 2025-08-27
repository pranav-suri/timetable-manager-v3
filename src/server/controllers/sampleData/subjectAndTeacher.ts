import {
    areEqual,
    parseCsvData,
    removeDuplicates,
    validateCsvData,
} from "./utils";
import type { ParseResult } from "papaparse";
import type { SubjectAndTeacherData } from "./csvHeaders";
import type { Prisma } from "__generated__/prisma/client";
import { prisma } from "@/server/prisma";

export async function uploadSubjectAndTeacherData(
    csvData: string,
    timetableId: number,
) {
    const parsedCsv = await parseCsvData<SubjectAndTeacherData>(csvData);
    if (!validateCsvData(parsedCsv, "subjectAndTeacher")) {
        return false;
    }

    await uploadTeacherData(parsedCsv, timetableId);

    // Group data is required for subject data
    await uploadGroupData(parsedCsv, timetableId);
    await uploadSubjectData(parsedCsv, timetableId);
    await uploadTeachData(parsedCsv, timetableId);

    return true;
}

async function uploadTeacherData(
    parsedCsv: ParseResult<SubjectAndTeacherData>,
    timetableId: number,
) {
    let teacherCreate: Prisma.TeacherCreateManyInput[] = parsedCsv.data.map(
        (row) => {
            return {
                name: row.teacher_name,
                email: row.teacher_email,
                timetableId: timetableId,
            };
        },
    );
    const emailNameMapping: Record<string, string> = {};
    for (const row of parsedCsv.data) {
        if (!emailNameMapping[row.teacher_email])
            emailNameMapping[row.teacher_email] = row.teacher_name;
    }

    teacherCreate = teacherCreate.map((teacher) => {
        teacher.name = emailNameMapping[teacher.email];
        return teacher;
    });

    teacherCreate = removeDuplicates(teacherCreate);
    await prisma.teacher.createMany({
        data: teacherCreate,
    });
    return true;
}

async function uploadGroupData(
    parsedCsv: ParseResult<SubjectAndTeacherData>,
    timetableId: number,
) {
    let groupCreate: Prisma.GroupCreateManyInput[] = parsedCsv.data.map(
        (row) => {
            return {
                name: row.group_name,
                allowSimultaneous: Number(row.group_allow_simultaneous)
                    ? true
                    : false,
                timetableId,
            };
        },
    );
    groupCreate = removeDuplicates(groupCreate);
    await prisma.group.createMany({
        data: groupCreate,
    });
    return true;
}

async function uploadSubjectData(
    parsedCsv: ParseResult<SubjectAndTeacherData>,
    timetableId: number,
) {
    // TODO: SubjectTags
    const groups = await prisma.group.findMany({
        where: { timetableId },
    });
    let subjectCreate: Prisma.SubjectCreateManyInput[] = parsedCsv.data.map(
        (row) => {
            const group = groups.find((group) =>
                areEqual(group.name, row.group_name),
            );

            if (!group)
                throw new Error(
                    `Group ${row.group_name} not found with timetableId ${timetableId}`,
                );

            return {
                name: row.subject_name,
                groupId: group.id,
                duration: row.is_lab ? 2 : 1,
            };
        },
    );
    subjectCreate = removeDuplicates(subjectCreate);
    await prisma.subject.createMany({
        data: subjectCreate,
    });
}

async function uploadTeachData(
    parsedCsv: ParseResult<SubjectAndTeacherData>,
    timetableId: number,
) {
    const teachers = await prisma.teacher.findMany({
        where: { timetableId },
    });
    const groups = await prisma.group.findMany({
        where: { timetableId },
    });

    const groupIds = groups.map((group) => group.id);

    const subjects = await prisma.subject.findMany({
        where: { groupId: { in: groupIds } },
    });

    let teachCreate: Prisma.TeachCreateManyInput[] = parsedCsv.data.map(
        (row) => {
            const subject = subjects.find((subject) =>
                areEqual(subject.name, row.subject_name),
            );
            if (!subject)
                throw new Error(
                    `Subject ${row.subject_name} not found with groupId in ${groupIds}`,
                );

            const teacher = teachers.find((teacher) =>
                areEqual(teacher.name, row.teacher_name),
            );
            if (!teacher)
                throw new Error(
                    `Teacher ${row.teacher_name} not found with timetableId ${timetableId}`,
                );

            return {
                teacherId: teacher.id,
                subjectId: subject.id,
            };
        },
    );
    teachCreate = removeDuplicates(teachCreate);
    await prisma.teach.createMany({
        data: teachCreate,
    });
}
