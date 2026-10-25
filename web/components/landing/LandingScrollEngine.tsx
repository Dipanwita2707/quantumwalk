"use client";

import { useEffect } from "react";

type LandingSectionId = "landing-title" | "experience" | "first-discovery" | "private-lab";

const navSections: { id: LandingSectionId; nav: string }[] = [
  { id: "landing-title", nav: "top" },
  { id: "experience", nav: "experience" },
  { id: "first-discovery", nav: "first-discovery" },
  { id: "private-lab", nav: "private-lab" },
];

/** Scroll progress, section reveals, and nav highlight for the landing page. */
export function LandingScrollEngine() {
  useEffect(() => {
    const root = document.querySelector(".quantum-landing") as HTMLElement | null;
    const header = document.querySelector(".ql-header");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    function setProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      root?.style.setProperty("--ql-scroll-p", ratio.toFixed(4));
      root?.style.setProperty("--ql-scroll-y", String(window.scrollY));
      document.documentElement.style.setProperty("--ql-scroll-y", String(window.scrollY));
    }

    function onScroll() {
      setProgress();
      header?.classList.toggle("ql-header-scrolled", window.scrollY > 20);
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("ql-is-visible");
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );

    document.querySelectorAll(".ql-reveal").forEach((node) => {
      if (reduced.matches) node.classList.add("ql-is-visible");
      else revealObserver.observe(node);
    });

    const visibleSections = new Map<string, number>();
    const spyObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleSections.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let bestId: LandingSectionId = navSections[0].id;
        let bestRatio = 0;
        for (const { id } of navSections) {
          const ratio = visibleSections.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        const active = navSections.find((item) => item.id === bestId)?.nav ?? "top";
        document.querySelectorAll("[data-ql-nav]").forEach((link) => {
          link.classList.toggle("ql-nav-active", link.getAttribute("data-ql-nav") === active);
        });
      },
      { threshold: [0, 0.12, 0.28, 0.45], rootMargin: "-20% 0px -55% 0px" },
    );

    navSections.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) spyObserver.observe(section);
    });

    reduced.addEventListener("change", () => {
      document.querySelectorAll(".ql-reveal").forEach((node) => node.classList.add("ql-is-visible"));
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    setProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      revealObserver.disconnect();
      spyObserver.disconnect();
      reduced.removeEventListener("change", () => {});
    };
  }, []);

  return (
    <>
      <div className="ql-scroll-progress" aria-hidden="true" />
      <div className="ql-scroll-glow" aria-hidden="true" />
    </>
  );
}
