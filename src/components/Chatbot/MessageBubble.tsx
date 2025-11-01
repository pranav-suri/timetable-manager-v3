import { Box, Paper, Typography } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface MessageBubbleProps {
  role: "user" | "model";
  content: string;
  timestamp?: string;
}

export function MessageBubble({
  role,
  content,
  timestamp,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 2,
        gap: 1,
      }}
    >
      {!isUser && (
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SmartToyIcon sx={{ color: "white", fontSize: 24 }} />
        </Box>
      )}

      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: "70%",
          bgcolor: isUser ? "primary.main" : "background.paper",
          color: isUser ? "primary.contrastText" : "text.primary",
          borderRadius: 2,
          "& pre": {
            bgcolor: "grey.900",
            color: "grey.100",
            p: 2,
            borderRadius: 1,
            overflow: "auto",
            my: 1,
          },
          "& code": {
            fontFamily: "monospace",
            fontSize: "0.9em",
          },
          "& :not(pre) > code": {
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
          },
          "& p": {
            my: 1,
            "&:first-of-type": { mt: 0 },
            "&:last-of-type": { mb: 0 },
          },
          "& ul, & ol": {
            my: 1,
            pl: 3,
          },
          "& li": {
            my: 0.5,
          },
          "& blockquote": {
            borderLeft: "4px solid",
            borderColor: isUser ? "rgba(255,255,255,0.3)" : "grey.400",
            pl: 2,
            my: 1,
            fontStyle: "italic",
          },
          "& table": {
            borderCollapse: "collapse",
            width: "100%",
            my: 1,
          },
          "& th, & td": {
            border: "1px solid",
            borderColor: isUser ? "rgba(255,255,255,0.2)" : "grey.300",
            p: 1,
            textAlign: "left",
          },
          "& th": {
            bgcolor: isUser ? "rgba(0,0,0,0.2)" : "grey.100",
            fontWeight: "bold",
          },
          "& a": {
            color: isUser ? "rgba(255,255,255,0.9)" : "primary.main",
            textDecoration: "underline",
          },
          "& h1, & h2, & h3, & h4, & h5, & h6": {
            mt: 2,
            mb: 1,
            "&:first-of-type": { mt: 0 },
          },
        }}
      >
        {isUser ? (
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {content}
          </Typography>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              p: ({ children }) => (
                <Typography variant="body1" component="p">
                  {children}
                </Typography>
              ),
              h1: ({ children }) => (
                <Typography variant="h5" component="h1" fontWeight="bold">
                  {children}
                </Typography>
              ),
              h2: ({ children }) => (
                <Typography variant="h6" component="h2" fontWeight="bold">
                  {children}
                </Typography>
              ),
              h3: ({ children }) => (
                <Typography
                  variant="subtitle1"
                  component="h3"
                  fontWeight="bold"
                >
                  {children}
                </Typography>
              ),
              li: ({ children }) => (
                <Typography variant="body1" component="li">
                  {children}
                </Typography>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
        {timestamp && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 1,
              opacity: 0.7,
            }}
          >
            {new Date(timestamp).toLocaleTimeString()}
          </Typography>
        )}
      </Paper>

      {isUser && (
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: "secondary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <PersonIcon sx={{ color: "white", fontSize: 24 }} />
        </Box>
      )}
    </Box>
  );
}
