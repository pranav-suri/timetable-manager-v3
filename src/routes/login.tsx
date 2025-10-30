import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
} from "@mui/material";
import { useTRPC } from "@/integrations/trpc";
import { useAuthStore } from "@/zustand/authStore";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const trpc = useTRPC();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { mutate: login, isPending } = useMutation({
    ...trpc.auth.login.mutationOptions(),
    onSuccess: (data) => {
      // Set session cookie
      document.cookie = `session=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;

      // Update auth store
      setUser(data.user);

      // Redirect to home
      navigate({ to: "/tt" });
    },
    onError: (error: any) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login({ email, password });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Timetable Manager
          </Typography>
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            align="center"
            color="text.secondary"
          >
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isPending}
              sx={{ mt: 3 }}
            >
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </Box>

          <Box sx={{ mt: 2, p: 2, bgcolor: "info.light", borderRadius: 1 }}>
            <Typography variant="caption" display="block" gutterBottom>
              <strong>Default Admin Credentials:</strong>
            </Typography>
            <Typography variant="caption" display="block">
              Email: admin@example.com
            </Typography>
            <Typography variant="caption" display="block">
              Password: ChangeMe123!
            </Typography>
            <Typography
              variant="caption"
              display="block"
              sx={{ mt: 1, color: "error.main" }}
            >
              ⚠️ Please change this password after first login!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
