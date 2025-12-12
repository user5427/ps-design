import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/appointments/service-categories")({
  beforeLoad: async () => {
    throw redirect({ to: "/categories" });
  },
  component: () => null,
});
