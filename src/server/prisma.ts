import { Prisma, PrismaClient } from '__generated__/prisma/client'

import sampleDataUpload from './controllers/sampleData'

export const prisma = new PrismaClient()

async function main() {
  // Create a new timetable if it doesn't exist

  await prisma.timetable.upsert({
    create: {
      id: 1,
      name: 'Timetable 1',
    },
    update: {},
    where: {
      id: 1,
    },
  })

  // Inner Join,
  await prisma.timetable.findFirst({
    where: {
      classrooms: {
        some: {},
      },
    },
  })

  await prisma.timetable.findFirst()
  console.time(': Time taken for data upload')
  try {
    await sampleDataUpload('ODD')
    await sampleDataUpload('EVEN')
    return
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        console.log("Unique constraint violation during sample data creation. Data already exists.")
      } else {
        console.error(e)
      }
    }
  } finally {
    console.timeEnd(': Time taken for data upload')
  }
}

main()
