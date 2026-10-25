"use client";
import { useParams } from "next/navigation";
import { LearningTrail } from "@/components/LearningTrail";
export default function LessonPage() {
  const { slug } = useParams<{ slug: string }>();
  return <LearningTrail key={slug} lessonSlug={slug} />;
}
