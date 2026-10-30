import { ScienceIcon } from "./QuantumUI";

export function CourseArtwork({ unit }: { unit: string }) {
  return <div className={`q-ui-course-art q-ui-course-art-${unit}`} aria-hidden="true">{unit === "hardware" && <ScienceIcon name="chip" size={58} />}</div>;
}
