export const batchAndSubdivisionData = {
    batch_name: "",
    department_name: "",
    division_name: "",
    subdivision_name: "",
};

export type BatchAndSubdivisionData = typeof batchAndSubdivisionData;

export const classroomData = {
    classroom_name: "",
    is_lab: "",
};

export type ClassroomData = typeof classroomData;

export const subjectAndTeacherData = {
    subject_name: "",
    department_name: "",
    batch_name: "",
    is_lab: "",
    group_name: "",
    group_allow_simultaneous: "",
    teacher_name: "",
    teacher_email: "",
};

export type SubjectAndTeacherData = typeof subjectAndTeacherData;

export const unavailabilityData = {
    teacher_email: "",
    day: "",
    slot_number: "",
};

export type UnavailabilityData = typeof unavailabilityData;

export const slotInfo = {
    day: "",
    number: "",
};
export type SlotInfo = typeof slotInfo;

export const timetableData = {
    day: "",
    slot_number: "",
    batch_name: "",
    department_name: "",
    subdivision_name: "",
    subject_name: "",
    group_name: "",
    teacher_email: "",
    classroom_name: "",
};

export type TimetableData = typeof timetableData;
