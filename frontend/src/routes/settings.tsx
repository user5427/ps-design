import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/features/settings";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
});

function SettingsComponent() {
  return <SettingsPage />;
}
