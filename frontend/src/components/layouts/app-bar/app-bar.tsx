import {
  Box,
  AppBar as MUIAppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import type React from "react";
import {
  useAuthUser,
  useImpersonateBusiness,
  useEndImpersonation,
} from "@/hooks/auth";
import { useBusinessesPaginated } from "@/queries/business";
import { useScopes } from "@/queries/scopes";
import { useAuthStore } from "@/store/auth";

type Logo = {
  image: React.ReactNode;
  text: string;
  size: number;
};

interface LogoProps {
  logo: Logo;
}

export interface AppBarProps extends LogoProps {}

const Logo: React.FC<LogoProps> = ({ logo }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Box
      sx={{
        width: logo.size,
        height: logo.size,
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      {logo.image}
    </Box>

    {logo.text && (
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {logo.text}
      </Typography>
    )}
  </Box>
);

const BusinessSwitcher: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: user } = useAuthUser();
  const { data: businesses, isLoading: businessesLoading } =
    useBusinessesPaginated(1, 100);
  const impersonate = useImpersonateBusiness();
  const endImpersonation = useEndImpersonation();
  const isImpersonating = useAuthStore((state) => state.getIsImpersonating());

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isImpersonating) {
      handleEndImpersonation();
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleBusinessSelect = async (businessId: string) => {
    handleClose();
    await impersonate.mutateAsync(businessId);
    window.location.reload();
  };

  const handleEndImpersonation = async () => {
    await endImpersonation.mutateAsync();
    window.location.reload();
  };

  if (!user) return null;

  return (
    <>
      <Button
        variant={isImpersonating ? "contained" : "outlined"}
        color={isImpersonating ? "warning" : "primary"}
        onClick={handleClick}
        disabled={impersonate.isPending || endImpersonation.isPending}
      >
        {impersonate.isPending || endImpersonation.isPending ? (
          <CircularProgress size={20} />
        ) : isImpersonating ? (
          "Switch Back"
        ) : (
          "Switch Business"
        )}
      </Button>
      {!isImpersonating && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          {businessesLoading && (
            <MenuItem disabled>
              <CircularProgress size={20} />
            </MenuItem>
          )}
          {businesses?.items
            .filter((business) => business.id !== user.businessId)
            .map((business) => (
              <MenuItem
                key={business.id}
                onClick={() => handleBusinessSelect(business.id)}
              >
                {business.name}
              </MenuItem>
            ))}
        </Menu>
      )}
    </>
  );
};

export const AppBar: React.FC<AppBarProps> = ({ logo }) => {
  const { data: user } = useAuthUser();
  const { data: scopes } = useScopes();

  // Check if user is superadmin (has SUPERADMIN scope)
  const isSuperAdmin =
    scopes?.some((scope) => scope.name === "SUPERADMIN") ?? false;

  return (
    <MUIAppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        color: "text.primary",
        bgcolor: "background.paper",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Logo logo={logo} />
        {user && isSuperAdmin && <BusinessSwitcher />}
      </Toolbar>
    </MUIAppBar>
  );
};
