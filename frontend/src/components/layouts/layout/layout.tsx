import { Container } from "@mui/material";
import type React from "react";

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
      {children}
    </Container>
  );
};
