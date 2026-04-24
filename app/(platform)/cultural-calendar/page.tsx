import { redirect } from "next/navigation";

// Cultural Calendar has been merged into the unified Calendar.
// Redirect visitors to the consolidated view.
export default function CulturalCalendarRedirect() {
  redirect("/calendar");
}
