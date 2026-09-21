import type { Metadata } from "next";
import ConvertPage from "../convert/page";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Bijoy to Unicode Converter — Free Bangla Encoding Tool",
  description:
    "Convert Bangla text between Bijoy (SutonnyMJ/ANSI) and Unicode instantly in your browser. Free, private, newsroom-grade কার, য-ফলা, রেফ handling.",
  alternates: { canonical: `${getSiteUrl()}/bijoy-unicode-converter` },
};

export default function BijoyUnicodeConverterPage() {
  return <ConvertPage />;
}
