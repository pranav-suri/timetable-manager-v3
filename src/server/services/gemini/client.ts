import { GoogleGenAI } from "@google/genai";
import { availableFunctions, executeFunction  } from "./functions";
import type {FunctionContext} from "./functions";
import { env } from "@/env";

/**
 * Initialize Gemini AI client
 */
const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

/**
 * Message type for conversation history
 */
export interface ChatMessage {
  role: "user" | "model";
  parts: string;
}

/**
 * Send a message to Gemini with function calling support
 */
export async function sendMessageToGemini(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  functionContext?: FunctionContext,
): Promise<string> {
  console.log("🤖 [Gemini Client] ========== START ==========");
  console.log("📨 [Gemini Client] Message:", userMessage.substring(0, 100));
  console.log("📜 [Gemini Client] History length:", conversationHistory.length);

  try {
    console.log("🔧 [Gemini Client] Preparing request...");
    console.log(
      "📋 [Gemini Client] Functions:",
      availableFunctions.map((f) => f.name).join(", "),
    );

    // Build conversation contents
    const contents: string[] = [];

    // Add history
    for (const msg of conversationHistory) {
      contents.push(msg.parts);
    }

    // Add current user message
    contents.push(userMessage);

    console.log("💬 [Gemini Client] Total messages:", contents.length);
    const systemInstruction = `You are an AI assistant for a timetable management system.
Help the user with timetable-related queries and tasks.`;
    // Send request with function declarations
    console.log("📤 [Gemini Client] Sending to API...");
    let response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: contents.join("\n\n"),
      config: {
        tools: [
          {
            functionDeclarations: availableFunctions,
          },
        ],
        systemInstruction,
      },
    });
    console.log("✅ [Gemini Client] Response received");

    // Handle function calls iteratively
    let iteration = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (
      response.functionCalls &&
      response.functionCalls.length > 0 &&
      iteration < maxIterations
    ) {
      iteration++;
      console.log(`🔄 [Gemini Client] Function call iteration ${iteration}`);

      const functionCall = response.functionCalls[0];
      if (!functionCall || !functionCall.name) {
        console.error("❌ [Gemini Client] Invalid function call structure");
        break;
      }

      console.log(`🎯 [Gemini Client] Function called: ${functionCall.name}`);
      console.log(
        `📝 [Gemini Client] Arguments:`,
        JSON.stringify(functionCall.args, null, 2),
      );

      try {
        // Execute the function
        console.log(
          `⚙️ [Gemini Client] Executing function: ${functionCall.name}...`,
        );
        
        if (!functionContext) {
          throw new Error("Function context is required but not provided");
        }
        
        const functionResult = await executeFunction(
          functionCall.name,
          functionCall.args as Record<string, any> | undefined,
          functionContext,
        );
        console.log(`✅ [Gemini Client] Function executed successfully`);
        console.log(
          `📥 [Gemini Client] Function result:`,
          functionResult.substring(0, 100),
        );

        // Send function response back to model
        console.log(
          `📤 [Gemini Client] Sending function result back to Gemini...`,
        );

        // Continue conversation with function result
        const functionResponseText = `Function ${functionCall.name} returned: ${functionResult}`;
        contents.push(functionResponseText);

        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents.join("\n\n"),
          config: {
            tools: [
              {
                functionDeclarations: availableFunctions,
              },
            ],
          },
        });

        console.log(
          `✅ [Gemini Client] Received response after function execution`,
        );
      } catch (error) {
        console.error("❌ [Gemini Client] Error executing function:", error);
        console.error("📚 [Gemini Client] Error details:", {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : String(error),
        });

        // Send error back to Gemini so it can handle gracefully
        console.log(
          `⚠️ [Gemini Client] Sending error response back to Gemini...`,
        );
        const errorResponseText = `Function ${functionCall.name} failed with error: ${error instanceof Error ? error.message : "Unknown error"}`;
        contents.push(errorResponseText);

        response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: contents.join("\n\n"),
          config: {
            tools: [
              {
                functionDeclarations: availableFunctions,
              },
            ],
          },
        });

        console.log(`✅ [Gemini Client] Received response after error`);
      }
    }

    if (iteration >= maxIterations) {
      console.warn("⚠️ [Gemini Client] Max function call iterations reached");
    }

    // Extract final text response
    console.log("📝 [Gemini Client] Extracting final text response...");
    const finalText = response.text || "No response text available";
    console.log(
      "✅ [Gemini Client] Final response:",
      finalText.substring(0, 100) + "...",
    );
    console.log("🎉 [Gemini Client] ========== SUCCESS ==========");

    return finalText;
  } catch (error) {
    console.error("❌ [Gemini Client] ========== ERROR ==========");
    console.error("🔥 [Gemini Client] Fatal error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.stack) {
      console.error("📚 [Gemini Client] Stack trace:");
      console.error(error.stack);
    }

    throw error;
  }
}
