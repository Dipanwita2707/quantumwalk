"use client";

import { useEffect } from "react";

/** Scroll-linked motion and section reveals for the /start journey. */
export function StartExperienceMotion() {
  useEffect(() => {
    const shell = document.querySelector(".discovery-shell") as HTMLElement | null;
    const header = document.querySelector(".discovery-header");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    function onScroll() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? y / max : 0;
      shell?.style.setProperty("--start-scroll-y", String(y));
      shell?.style.setProperty("--start-scroll-p", ratio.toFixed(4));
      document.documentElement.style.setProperty("--start-scroll-y", String(y));
      header?.classList.toggle("discovery-header-scrolled", y > 16);
      shell?.classList.toggle("start-scrolled", y > 16);
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("start-is-visible");
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
    );

    document.querySelectorAll(".start-reveal").forEach((node) => {
      if (reduced.matches) node.classList.add("start-is-visible");
      else revealObserver.observe(node);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      revealObserver.disconnect();
    };
  }, []);

  return <div className="start-scroll-progress" aria-hidden="true" />;
}
