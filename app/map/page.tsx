import { redirect } from "next/navigation";

/** Old world-map links land on the faith feed. */
export default function MapPage() {
  redirect("/feed");
}
