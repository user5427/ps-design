import { Container } from "@mui/material";
import type React from "react";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Container maxWidth="lg">
      {children}
    </Container>
  );
};

export { MainLayout };
