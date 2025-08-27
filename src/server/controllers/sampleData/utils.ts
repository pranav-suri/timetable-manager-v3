import Papa from "papaparse";
import {
    BatchAndSubdivisionData,
    ClassroomData,
    SubjectAndTeacherData,
    UnavailabilityData,
    SlotInfo,
    TimetableData,
    batchAndSubdivisionData,
    classroomData,
    subjectAndTeacherData,
    unavailabilityData,
    slotInfo,
    timetableData,
} from "./csvHeaders";

export type Maybe<T> = T | undefined;

export function removeDuplicates<T>(arr: T[]): T[] {
    const uniqueArray = Array.from(
        new Set(arr.map((value) => JSON.stringify(value))),
    ).map((json) => JSON.parse(json));

    return uniqueArray;
}

export function areEqual(a: Maybe<string>, b: Maybe<string>) {
    if (!a || !b) return false;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function parseCsvData<T>(csvData: string) {
    const parsedCsv = Papa.parse<T>(csvData, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string) => {
            return value.trim();
        },
        transformHeader: (header: string) => {
            // This will convert the header to lowercase and replace spaces with underscores
            const newHeader = header.trim().toLowerCase().split(" ").join("_");
            return newHeader;
        },
    });
    parsedCsv.data = Array.from(new Set(parsedCsv.data));
    return parsedCsv;
}

export function validateCsvData(
    parsedCsv: Papa.ParseResult<
        | BatchAndSubdivisionData
        | ClassroomData
        | SubjectAndTeacherData
        | UnavailabilityData
        | SlotInfo
        | TimetableData
    >,
    csvType:
        | "batchAndSubdivision"
        | "classroom"
        | "subjectAndTeacher"
        | "unavailability"
        | "slot"
        | "timetable",
) {
    // This function will handle errors with missing headings
    // This does not validate missing data in each row
    let expectedKeys: string[] = [];
    let dataKeys: string[] = [];

    switch (csvType) {
        // This switch case is for assigning values of expectedKeys and dataKeys variable
        case "batchAndSubdivision":
            expectedKeys = Object.keys(batchAndSubdivisionData);
            dataKeys = Object.keys(parsedCsv.data[0]);
            break;
        case "classroom":
            expectedKeys = Object.keys(classroomData);
            dataKeys = Object.keys(parsedCsv.data[0]);
            break;
        case "subjectAndTeacher":
            expectedKeys = Object.keys(subjectAndTeacherData);
            dataKeys = Object.keys(parsedCsv.data[0]);
            break;
        case "unavailability":
            expectedKeys = Object.keys(unavailabilityData);
            dataKeys = Object.keys(parsedCsv.data[0]);
            break;
        case "slot": {
            expectedKeys = Object.keys(slotInfo);
            dataKeys = Object.keys(parsedCsv.data[0]);
            break;
        }
        case "timetable": {
            expectedKeys = Object.keys(timetableData);
            dataKeys = Object.keys(parsedCsv.data[0]);
            break;
        }
        default: {
            const _exhaustiveCheck: never = csvType;
            return _exhaustiveCheck;
        }
    }

    // This loop will remove the row with missing data
    for (const error of parsedCsv.errors) {
        if (error.code === "UndetectableDelimiter") {
            console.log("Empty file uploaded");
            return false;
        }

        // This runs in case of missing headings (missing commas at the last row of the csv file)
        if (error.code === "TooFewFields" && error.row) {
            // console.log("Deleting row: ", error.row + 2); // +2 because top row is header and data starts from index 0
            // console.log("Row data: ", parsedCsv.data[error.row])
            parsedCsv.data.splice(error.row, 1);
        }
    }

    let valid = true;
    // This loop will check if all expected keys are present in the data[0] object
    for (const key of expectedKeys) {
        if (!dataKeys.includes(key)) {
            valid = false;
            console.log("Header missing: ", key);
        }
    }
    if (!valid) return false;
    return true;
}

type SubdivisionNameArgs = {
    batchName: string;
    departmentName: string;
    subdivisionName: string;
};
export function joinSubdivisionName({
    batchName,
    departmentName,
    subdivisionName,
}: SubdivisionNameArgs) {
    return `${batchName.toUpperCase()} ${departmentName.toUpperCase()} ${subdivisionName.toUpperCase()}`;
}
