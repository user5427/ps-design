import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import { useSettingsStore } from "@/store/settings";
import { sidebarSections } from "@/constants";

export function SettingsPage() {
  const {
    showBackground,
    visibleSections,
    setShowBackground,
    setSectionVisibility,
  } = useSettingsStore();

  // Get all top-level sections for visibility toggles
  const sections = sidebarSections.map((section) => section.label);

  // Sections that cannot be disabled
  const mandatorySections = ["Dashboard", "Settings"];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Stack spacing={3}>
        {/* Appearance Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={showBackground}
                  onChange={(e) => setShowBackground(e.target.checked)}
                />
              }
              label="Show Background Image"
            />
          </CardContent>
        </Card>

        {/* Sidebar Visibility Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sidebar Sections
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Alert severity="info" sx={{ mb: 2 }}>
              Control which sections appear in the sidebar. Dashboard and
              Settings cannot be hidden.
            </Alert>

            <Stack spacing={1}>
              {sections.map((sectionLabel) => {
                const isMandatory = mandatorySections.includes(sectionLabel);
                const isVisible = visibleSections[sectionLabel] !== false;

                return (
                  <FormControlLabel
                    key={sectionLabel}
                    control={
                      <Switch
                        checked={isVisible}
                        onChange={(e) =>
                          setSectionVisibility(sectionLabel, e.target.checked)
                        }
                        disabled={isMandatory}
                      />
                    }
                    label={sectionLabel}
                  />
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
