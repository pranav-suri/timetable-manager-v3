import { prisma } from "@/server/prisma";

type SubdivisionGroup = {
  groupName: string;
  subdivisionNames: string[];
};

const data: SubdivisionGroup[] = [
  {
    groupName: "SY CS A",
    subdivisionNames: ["SY CS A1", "SY CS A2", "SY CS A3"],
  },
  {
    groupName: "SY CS B",
    subdivisionNames: ["SY CS B1", "SY CS B2", "SY CS B3"],
  },
  {
    groupName: "SY CS C",
    subdivisionNames: ["SY CS C1", "SY CS C2", "SY CS C3"],
  },
  {
    groupName: "TY CS A",
    subdivisionNames: ["TY CS A1", "TY CS A2", "TY CS A3"],
  },
  {
    groupName: "TY CS B",
    subdivisionNames: ["TY CS B1", "TY CS B2", "TY CS B3"],
  },
  {
    groupName: "TY CS C",
    subdivisionNames: ["TY CS C1", "TY CS C2", "TY CS C3"],
  },
  //   {
  //     groupName: "FLY CS A",
  //     subdivisionNames: ["FLY CS A1", "FLY CS A2", "FLY CS A3"],
  //   },
  //   {
  //     groupName: "FLY CS B",
  //     subdivisionNames: ["FLY CS B1", "FLY CS B2", "FLY CS B3"],
  //   },
  //   {
  //     groupName: "FLY CS C",
  //     subdivisionNames: ["FLY CS C1", "FLY CS C2", "FLY CS C3"],
  //   },
  {
    groupName: "SY CS",
    subdivisionNames: [
      "SY CS A1",
      "SY CS A2",
      "SY CS A3",
      "SY CS B1",
      "SY CS B2",
      "SY CS B3",
      "SY CS C1",
      "SY CS C2",
      "SY CS C3",
    ],
  },
  {
    groupName: "TY CS",
    subdivisionNames: [
      "TY CS A1",
      "TY CS A2",
      "TY CS A3",
      "TY CS B1",
      "TY CS B2",
      "TY CS B3",
      "TY CS C1",
      "TY CS C2",
      "TY CS C3",
    ],
  },
  //   {
  //     groupName: "FLY CS",
  //     subdivisionNames: [
  //       "FLY CS A1",
  //       "FLY CS A2",
  //       "FLY CS A3",
  //       "FLY CS B1",
  //       "FLY CS B2",
  //       "FLY CS B3",
  //       "FLY CS C1",
  //       "FLY CS C2",
  //       "FLY CS C3",
  //     ],
  //   },
];

const timetables = await prisma.timetable.findMany();

for (const timetable of timetables) {
  const timetableId = timetable.id;
  const subvisions = await prisma.subdivision.findMany({
    where: { timetableId: timetable.id },
  });
  const subdivisionMap: Record<string, string> = {};
  for (const subdivision of subvisions) {
    subdivisionMap[subdivision.name] = subdivision.id;
  }

  for (const group of data) {
    for (const subdiv of group.subdivisionNames) {
      await prisma.subdivisionGroupTemp.upsert({
        where: {
          name_subdivisionId_timetableId: {
            name: group.groupName,
            timetableId: timetableId,
            subdivisionId: subdivisionMap[subdiv]!,
          },
        },
        update: {},
        create: {
          name: group.groupName,
          timetableId: timetableId,
          subdivisionId: subdivisionMap[subdiv]!,
        },
      });
    }
  }
}

console.log("Subdivision groups temp populated.");
