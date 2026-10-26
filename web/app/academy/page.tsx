import { redirect } from "next/navigation";

/** Legacy hub URL — single Learn discovery lives at /learn (Phase 4 IA). */
export default function AcademyHubRedirect() {
  redirect("/learn");
}
