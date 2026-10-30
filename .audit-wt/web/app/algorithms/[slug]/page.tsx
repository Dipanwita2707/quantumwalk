"use client";
import { useParams } from "next/navigation";
import { LibraryDetail } from "@/components/LibraryDetail";
export default function AlgorithmPage() {
  const { slug } = useParams<{ slug: string }>();
  return <LibraryDetail kind="algorithms" slug={slug} />;
}
