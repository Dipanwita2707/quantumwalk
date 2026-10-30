"use client";
import { useParams } from "next/navigation";
import { LibraryDetail } from "@/components/LibraryDetail";
export default function ChallengePage() {
  const { slug } = useParams<{ slug: string }>();
  return <LibraryDetail kind="challenges" slug={slug} />;
}
