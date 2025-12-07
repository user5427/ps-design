import {  Container } from "@mui/material";
import type React from "react";

interface PublicLayoutProps {
  children?: React.ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
      {children}
    </Container>
  );
};
