import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/menu/categories")({
  beforeLoad: async () => {
    throw redirect({ to: "/categories" });
  },
  component: () => null,
});
