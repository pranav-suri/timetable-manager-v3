import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { authedProcedure, createTRPCRouter } from "../init";
import type { ChatMessage } from "@/server/services/gemini/client";
import { sendMessageToGemini } from "@/server/services/gemini/client";

/**
 * Input schema for chat messages
 */
const chatMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  parts: z.string(),
});

/**
 * Input schema for sending a message
 */
const sendMessageInputSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  timetableId: z.string().min(1, "Timetable ID is required"),
  conversationHistory: z.array(chatMessageSchema).optional().default([]),
});

/**
 * Chatbot Router
 * Handles AI chatbot interactions with function calling support
 */
export const chatbotRouter = createTRPCRouter({
  /**
   * Send a message to the chatbot
   */
  sendMessage: authedProcedure
    .input(sendMessageInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { message, timetableId, conversationHistory } = input;
      const { session } = ctx;

      console.log("🤖 [Chatbot] ========== START ==========");
      console.log("📝 [Chatbot] Input received:", {
        messageLength: message.length,
        messagePreview: message.substring(0, 50) + "...",
        timetableId,
        historyLength: conversationHistory.length,
        userId: session.userId,
        organizationId: session.organizationId,
      });

      try {
        // Verify user has access to this timetable
        console.log("🔍 [Chatbot] Step 1: Verifying timetable access...");
        const timetable = await ctx.prisma.timetable.findUnique({
          where: {
            id: timetableId,
            organizationId: session.organizationId,
          },
        });

        if (!timetable) {
          console.error("❌ [Chatbot] Timetable not found or access denied");
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Timetable not found or you don't have access to it",
          });
        }

        console.log("✅ [Chatbot] Step 1 Complete: Timetable found:", {
          name: timetable.name,
          id: timetable.id,
        });

        // Add system context about the user and timetable
        console.log("📋 [Chatbot] Step 2: Preparing system context...");

        // Prepare conversation with system context
        const contextualizedHistory: ChatMessage[] = [
          ...conversationHistory,
        ];

        console.log("✅ [Chatbot] Step 2 Complete: History prepared with", contextualizedHistory.length, "messages");

        // Send message to Gemini with function context
        console.log("📤 [Chatbot] Step 3: Calling Gemini API...");
        console.log("💬 [Chatbot] User message:", message);
        
        const reply = await sendMessageToGemini(message, contextualizedHistory, {
          prisma: ctx.prisma,
          timetableId,
          organizationId: session.organizationId,
        });
        
        console.log("✅ [Chatbot] Step 3 Complete: Received reply from Gemini");
        console.log("📥 [Chatbot] Reply preview:", reply.substring(0, 100) + "...");

        const response = {
          reply,
          timestamp: new Date().toISOString(),
        };

        console.log("🎉 [Chatbot] ========== SUCCESS ==========");
        return response;
      } catch (error) {
        console.error("❌ [Chatbot] ========== ERROR ==========");
        console.error("🔥 [Chatbot] Error caught:", {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : String(error),
          isTRPCError: error instanceof TRPCError,
        });
        
        if (error instanceof Error && error.stack) {
          console.error("📚 [Chatbot] Stack trace:");
          console.error(error.stack);
        }

        // Handle specific error types
        if (error instanceof TRPCError) {
          console.error("🚫 [Chatbot] Re-throwing TRPCError with code:", error.code);
          throw error;
        }

        // Generic error response
        console.error("🔥 [Chatbot] Throwing generic INTERNAL_SERVER_ERROR");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process your message. Please try again.",
          cause: error,
        });
      }
    }),
});