import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { MessageBubble } from "./MessageBubble";

interface Message {
  role: "user" | "model";
  parts: string;
  timestamp?: string;
}

interface ChatInterfaceProps {
  timetableId: string;
  onSendMessage: (message: string, history: Message[]) => Promise<string>;
}

export function ChatInterface({ timetableId, onSendMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      parts: "Hello! I'm your AI assistant for the Timetable Manager. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      parts: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Get conversation history (excluding the welcome message)
      const history = messages.slice(1);

      // Send to backend
      const reply = await onSendMessage(userMessage.parts, history);

      // Add AI response to chat
      const aiMessage: Message = {
        role: "model",
        parts: reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(
        err instanceof Error ? err.message : "Failed to send message. Please try again."
      );

      // Remove the user message that failed
      setMessages((prev) => prev.slice(0, -1));
      // Restore the input
      setInputValue(userMessage.parts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Messages Container */}
      <Paper
        ref={messagesContainerRef}
        elevation={0}
        sx={{
          flex: 1,
          overflow: "auto",
          p: 3,
          bgcolor: "background.default",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            role={message.role}
            content={message.parts}
            timestamp={message.timestamp}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={20} sx={{ color: "white" }} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Thinking...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Input Area */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          mt: 2,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          sx={{
            width: 56,
            height: 56,
            bgcolor: "primary.main",
            color: "white",
            "&:hover": {
              bgcolor: "primary.dark",
            },
            "&:disabled": {
              bgcolor: "action.disabledBackground",
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}