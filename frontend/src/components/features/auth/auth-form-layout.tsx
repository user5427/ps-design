import { Box, Link as MuiLink, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";
import type React from "react";

interface AuthFormLayoutProps {
  title: string;
  children: React.ReactNode;
  switchText: string;
  switchLink: string;
  switchLinkText: string;
}

export const AuthFormLayout: React.FC<AuthFormLayoutProps> = ({
  title,
  children,
  switchText,
  switchLink,
  switchLinkText,
}) => (
  <Box
    sx={{
      width: "100%",
      maxWidth: "360px",
      aspectRatio: "9/16",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      px: 3,
    }}
  >
    <Typography variant="h4" sx={{ mb: 4, textAlign: "center" }}>
      {title}
    </Typography>
    {children}
    <Typography
      variant="body2"
      sx={{ textAlign: "center", color: "text.secondary", mt: 2 }}
    >
      {switchText}{" "}
      <MuiLink component={Link} to={switchLink} sx={{ fontWeight: 500 }}>
        {switchLinkText}
      </MuiLink>
    </Typography>
  </Box>
);
