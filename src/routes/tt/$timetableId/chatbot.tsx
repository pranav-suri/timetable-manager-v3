import { createFileRoute } from "@tanstack/react-router";
import { Container, Box, Typography, Paper } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { ChatInterface } from "@/components/Chatbot/ChatInterface";
import { trpcClient } from "@/integrations/trpc";

export const Route = createFileRoute("/tt/$timetableId/chatbot")({
  component: ChatbotPage,
});

interface Message {
  role: "user" | "model";
  parts: string;
}

function ChatbotPage() {
  const { timetableId } = Route.useParams();

  const handleSendMessage = async (message: string, history: Message[]) => {
    try {
      const response = await trpcClient.chatbot.sendMessage.mutate({
        message,
        timetableId,
        conversationHistory: history,
      });

      return response.reply;
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to communicate with the chatbot"
      );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <SmartToyIcon sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            AI Assistant
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Ask questions about your timetable or get help with scheduling
          </Typography>
        </Box>
      </Paper>

      {/* Chat Interface */}
      <ChatInterface timetableId={timetableId} onSendMessage={handleSendMessage} />

      {/* Info Section */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          💡 Try asking: "Explain how the timetable generation works" or "Show me the classes scheduled for today"
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          This chatbot is powered by Google Gemini 2.0 Flash with function calling
          capabilities and supports markdown formatting.
        </Typography>
      </Box>
    </Container>
  );
}