import { Tajawal } from "next/font/google";

/** خط Tajawal (tjwal) للنصوص العربية */
export const fontTjwal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tjwal",
});
