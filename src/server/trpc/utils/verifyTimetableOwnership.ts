import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "../init";

/**
 * Verify that a timetable belongs to the user's organization
 * Throws NOT_FOUND error if timetable doesn't exist or doesn't belong to organization
 */
export async function verifyTimetableOwnership(
  ctx: TrpcContext,
  timetableId: string
): Promise<void> {
  const { prisma, session } = ctx;
  
  if (!session) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'No active session' 
    });
  }
  
  const timetable = await prisma.timetable.findFirst({
    where: { 
      id: timetableId,
      organizationId: session.organizationId 
    }
  });
  
  if (!timetable) {
    throw new TRPCError({ 
      code: 'NOT_FOUND',
      message: 'Timetable not found or access denied'
    });
  }
}

/**
 * Verify entity ownership by checking its timetable
 */
export async function verifyEntityOwnership(
  ctx: TrpcContext,
  entityId: string,
  entityType: 'teacher' | 'classroom' | 'group' | 'subdivision' | 'slot' | 'lecture' | 'subject'
): Promise<void> {
  const { prisma, session } = ctx;
  
  if (!session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No active session'
    });
  }
  
  // Subject has a special case - it's related through group
  if (entityType === 'subject') {
    const subject = await prisma.subject.findUnique({
      where: { id: entityId },
      include: {
        group: {
          include: { timetable: true }
        }
      }
    });
    
    if (!subject || subject.group.timetable.organizationId !== session.organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Subject not found or access denied'
      });
    }
    return;
  }
  
  const entity = await (prisma[entityType] as any).findUnique({
    where: { id: entityId },
    include: { timetable: true }
  });
  
  if (!entity || entity.timetable.organizationId !== session.organizationId) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `${entityType} not found or access denied`
    });
  }
}