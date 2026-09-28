import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skill Engineering ERP",
    short_name: "Skill ERP",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#102d36",
  };
}
