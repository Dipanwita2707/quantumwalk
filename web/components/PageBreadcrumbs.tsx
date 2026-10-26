"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildBreadcrumbTrail, pageTitleFromTrail } from "@/lib/breadcrumbTrail";

export function PageBreadcrumbs() {
  const pathname = usePathname();
  const trail = buildBreadcrumbTrail(pathname);
  if (trail.length <= 1) return null;

  const pageTitle = pageTitleFromTrail(trail);

  return (
    <div className="app-breadcrumb-bar">
      <nav aria-label="Breadcrumb">
        <ol className="app-breadcrumbs">
          {trail.map((segment, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={`${segment.label}-${index}`}>
                {segment.href && !isLast ? (
                  <Link href={segment.href}>{segment.label}</Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined}>{segment.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {pageTitle && (
        <p className="app-page-title visually-hidden" id="app-page-title">
          {pageTitle}
        </p>
      )}
    </div>
  );
}
