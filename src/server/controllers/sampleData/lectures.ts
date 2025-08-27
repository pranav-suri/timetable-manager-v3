import { joinSubdivisionName, parseCsvData, validateCsvData } from "./utils";
import type { TimetableData } from "./csvHeaders";
import { prisma } from "@/server/prisma";

export async function uploadTimetableData(
    csvData: string,
    timetableId: number,
) {
    const parsedCsv = await parseCsvData<TimetableData>(csvData);

    if (!validateCsvData(parsedCsv, "timetable")) {
        return false;
    }
    for (const row of parsedCsv.data) {
        // Step 1: Lookup existing related entities by their unique identifiers
        const { classroom, slot, subdivision, subject, teacher } =
            await fetchInformation(row, timetableId);

        // Step 2: Check if the Lecture entry with subject and teacher
        const lecture = await findOrCreateLectureWithSlotData({
            teacherId: teacher.id,
            subjectId: subject.id,
            slotId: slot.id,
        });

        // Step 3: Create LectureSubdivision and LectureClassroom entries
        await upsertLectureSubdivisionAndClassroom({
            lectureId: lecture.id,
            subdivisionId: subdivision.id,
            classroomId: classroom.id,
        });
    }
    await combineDuplicateLectures(timetableId);
    return true;
}

/**
 * Combine duplicate lectures and remove the duplicates.
 * If two lectures have the same teacher, subject, classrooms, and subdivisions,
 * then they are duplicates and the slotData will be updated to point to the original lecture
 */
async function combineDuplicateLectures(timetableId: number) {
    const slotIds = (
        await prisma.slot.findMany({
            where: { timetableId },
        })
    ).map(({ id }) => id);

    const lectures = await prisma.lecture.findMany({
        where: {
            slotDatas: {
                some: {
                    slotId: {
                        in: slotIds,
                    },
                },
            },
        },
        include: {
            lectureClassrooms: true,
            lectureSubdivisions: true,
        },
    });

    const uniqueLectures: Record<string, number> = {};

    for (const lecture of lectures) {
        const classroomIds = lecture.lectureClassrooms
            .map(({ classroomId }) => classroomId)
            .sort();
        const subdivisionIds = lecture.lectureSubdivisions
            .map(({ subdivisionId }) => subdivisionId)
            .sort();

        const key = `${lecture.subjectId}_${lecture.teacherId}_"c"_${classroomIds.join("_")}_s_${subdivisionIds.join("_")}`;
        if (!uniqueLectures[key]) {
            // Add this lecture as the original
            uniqueLectures[key] = lecture.id;
            continue;
        }
        const originalLectureId = uniqueLectures[key];

        // Update slotData to point to the original lecture
        await prisma.slotData.updateMany({
            where: {
                lectureId: lecture.id,
            },
            data: {
                lectureId: originalLectureId,
            },
        });

        // OnUpdate Cascade was off at the time of writing this code
        // Hence, we need to first delete the lectureSubdivision and lectureClassroom entries
        // and then delete the lecture
        await prisma.lectureSubdivision.deleteMany({
            where: {
                lectureId: lecture.id,
            },
        });
        await prisma.lectureClassroom.deleteMany({
            where: {
                lectureId: lecture.id,
            },
        });
        await prisma.lecture.delete({
            where: {
                id: lecture.id,
            },
        });
    }
}

/**
 * Fetch related information for the row
 */
async function fetchInformation(row: TimetableData, timetableId: number) {
    const {
        day,
        slot_number: slotNumber,
        department_name: departmentName,
        batch_name: batchName,
        subdivision_name: subdivisionName,
        subject_name: subjectName,
        group_name: groupName,
        teacher_email: teacherEmail,
        classroom_name: classroomName,
    } = row;

    const joinedSubdivisionName = joinSubdivisionName({
        batchName,
        departmentName,
        subdivisionName,
    });

    const teacher = await prisma.teacher.findUnique({
        where: { email_timetableId: { email: teacherEmail, timetableId } },
    });
    const group = await prisma.group.findUnique({
        where: { name_timetableId: { name: groupName, timetableId } },
    });

    if (!group) {
        console.error("Missing group data for row:", row);
        throw new Error();
    }
    const subject = await prisma.subject.findUnique({
        where: {
            name_groupId: { name: subjectName, groupId: group.id },
        },
    });
    const slot = await prisma.slot.findUnique({
        where: {
            day_number_timetableId: {
                day: Number(day),
                number: Number(slotNumber),
                timetableId,
            },
        },
    });
    const subdivision = await prisma.subdivision.findUnique({
        where: {
            name_timetableId: { name: joinedSubdivisionName, timetableId },
        },
    });
    const classroom = await prisma.classroom.findUnique({
        where: { name_timetableId: { name: classroomName, timetableId } },
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!teacher || !subject || !slot || !subdivision || !classroom || !group) {
        if (!teacher)
            console.error("Missing teacher data for row:", teacherEmail);
        if (!subject)
            console.error("Missing subject data for row:", subjectName);
        if (!slot) console.error("Missing slot data for row:", day, slotNumber);
        if (!subdivision)
            console.error("Missing subdivision data for row:", row);
        if (!classroom)
            console.error("Missing classroom data for row:", classroomName);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!group) console.error("Missing group data for row:", groupName);

        console.error("Missing related data for row:", row);
        throw new Error();
    }

    return { teacher, subject, slot, subdivision, classroom, group };
}

async function findOrCreateLectureWithSlotData({
    teacherId,
    subjectId,
    slotId,
}: CreateLectureWithSlotDataArgs) {
    const lectures = await prisma.lecture.findMany({
        where: {
            teacherId,
            subjectId,
        },
        include: { slotDatas: true },
    });

    for (const lecture of lectures) {
        // The lecture has not been assigned to any slot, this shouldn't
        // as we always create a slotData entry when creating a lecture
        // Just added this check for safety, in case we separate out the
        // creation of slotData from lecture creation
        if (lecture.slotDatas.length === 0) return lecture;
        const slotData = lecture.slotDatas.find((slotData) => {
            return slotData.slotId === slotId;
        });
        if (slotData) return lecture;
    }

    // No matching lecture found, create a new lecture
    return await createLectureWithSlotData({
        teacherId,
        subjectId,
        slotId,
    });
}

type CreateLectureWithSlotDataArgs = {
    teacherId: number;
    subjectId: number;
    slotId: number;
};
/**
 * Create a new lecture with slotData.
 * It does not create lectureSubdivision and lectureClassroom entries
 */
async function createLectureWithSlotData({
    teacherId,
    subjectId,
    slotId,
}: CreateLectureWithSlotDataArgs) {
    const lecture = await prisma.lecture.create({
        data: {
            teacherId,
            subjectId,
        },
    });

    await prisma.slotData.create({
        data: {
            slotId,
            lectureId: lecture.id,
        },
    });

    return lecture;
}

/**
 * Find or Create Subdivions and Classrooms assocations for the lecture
 */
async function upsertLectureSubdivisionAndClassroom({
    lectureId,
    subdivisionId,
    classroomId,
}: {
    lectureId: number;
    subdivisionId: number;
    classroomId: number;
}) {
    await prisma.lectureSubdivision.upsert({
        where: {
            subdivisionId_lectureId: {
                lectureId,
                subdivisionId,
            },
        },
        update: {},
        create: {
            lectureId,
            subdivisionId,
        },
    });
    await prisma.lectureClassroom.upsert({
        where: {
            classroomId_lectureId: {
                lectureId,
                classroomId,
            },
        },
        update: {},
        create: {
            lectureId,
            classroomId,
        },
    });
}
