import type { MetadataRoute } from "next";

/** Web app manifest — installable shell + offline study pages (icons: user to add 192/512 PNGs). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BornoLab — বাংলা Font & Document Suite",
    short_name: "BornoLab",
    description: "Bilingual IT job prep: notes, practice, timed exams — with offline reading.",
    start_url: "/study",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#070b16",
    theme_color: "#070b16",
    lang: "bn",
    icons: [
      { src: "/logo.png", sizes: "any", type: "image/png" },
    ],
  };
}
