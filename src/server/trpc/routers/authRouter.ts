import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { adminProcedure, authedProcedure, createTRPCRouter, publicProcedure } from "../init";

const BCRYPT_ROUNDS = 12;
const SESSION_EXPIRY_DAYS = 7;

export const authRouter = createTRPCRouter({
  // Login
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find user
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        include: { organization: true }
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Account is inactive'
        });
      }
      
      // Check if organization is active
      if (!user.organization.isActive) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Organization is inactive'
        });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        });
      }
      
      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
      
      const session = await ctx.prisma.session.create({
        data: {
          userId: user.id,
          token: nanoid(32),
          expiresAt,
        }
      });
      
      // Update last login
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
      
      return {
        token: session.token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
        }
      };
    }),
  
  // Logout
  logout: authedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.sessionToken) {
        await ctx.prisma.session.delete({
          where: { token: ctx.sessionToken }
        }).catch(() => {
          // Session might not exist, ignore error
        });
      }
      return { success: true };
    }),
  
  // Get current user
  me: authedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId },
        include: { organization: true }
      });
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        organizationSlug: user.organization.slug,
        lastLoginAt: user.lastLoginAt,
      };
    }),
  
  // Change password
  changePassword: authedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      ),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId }
      });
      
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      // Verify current password
      const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Current password is incorrect'
        });
      }
      
      // Hash new password
      const newPasswordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
      
      // Update password
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash }
      });
      
      // Invalidate all other sessions
      await ctx.prisma.session.deleteMany({
        where: {
          userId: user.id,
          token: { not: ctx.sessionToken }
        }
      });
      
      return { success: true };
    }),
  
  // Create user (Admin only)
  createUser: adminProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
      password: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists in this organization
      const existingUser = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          organizationId: ctx.session.organizationId
        }
      });
      
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists'
        });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      
      // Create user
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
          passwordHash,
          organizationId: ctx.session.organizationId,
        }
      });
      
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    }),
  
  // List users (Admin only)
  listUsers: adminProcedure
    .query(async ({ ctx }) => {
      const users = await ctx.prisma.user.findMany({
        where: { organizationId: ctx.session.organizationId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        }
      });
      
      return users;
    }),
  
  // Update user (Admin only)
  updateUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, ...updateData } = input;
      
      // Verify user belongs to same organization
      const user = await ctx.prisma.user.findFirst({
        where: {
          id: userId,
          organizationId: ctx.session.organizationId
        }
      });
      
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      // Prevent admin from deactivating themselves
      if (userId === ctx.session.userId && updateData.isActive === false) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot deactivate your own account'
        });
      }
      
      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      };
    }),
});