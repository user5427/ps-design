import React from "react";
import type { AppBarProps } from "@/components/layouts/app-bar";

export const AppBarData: AppBarProps = {
  logo: {
    image: React.createElement("img", {
      src: "/images/logo.png",
      alt: "logo",
      style: { width: "100%", height: "100%", objectFit: "cover" },
    }),
    text: "ADEPI",
  },
};
