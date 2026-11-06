import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const bebas = loadBebasNeue("normal", {
  weights: ["400"],
  subsets: ["latin"],
}).fontFamily;

export const inter = loadInter("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
}).fontFamily;
