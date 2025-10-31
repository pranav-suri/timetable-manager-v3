import { createFileRoute } from "@tanstack/react-router";
import sampleDataUpload from "@/server/controllers/sampleData";
import { prisma } from "@/server/prisma";

export const Route = createFileRoute("/api/generate/sample-data")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const timetableName =
            body.timetableName || "Sample Timetable for Generation";

          // Use the existing sample data upload system
          await sampleDataUpload(timetableName, "default-org");

          // Get the created timetable info
          const timetable = await prisma.timetable.findFirst({
            where: { name: timetableName },
            include: {
              _count: {
                select: {
                  slots: true,
                  classrooms: true,
                  subdivisions: true,
                  teachers: true,
                  lectures: true,
                },
              },
            },
          });

          if (!timetable) {
            throw new Error("Failed to create or find timetable");
          }

          return Response.json({
            success: true,
            timetableId: timetable.id,
            timetableName: timetable.name,
            message: "Sample data created successfully using existing CSV data",
            stats: {
              slots: timetable._count.slots,
              classrooms: timetable._count.classrooms,
              subdivisions: timetable._count.subdivisions,
              teachers: timetable._count.teachers,
              lectures: timetable._count.lectures,
            },
          });
        } catch (error) {
          console.error("Error creating sample data:", error);
          return Response.json(
            {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
