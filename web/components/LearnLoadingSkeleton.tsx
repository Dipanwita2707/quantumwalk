export function LearnLoadingSkeleton() {
  return (
    <div className="learn-loading-skeleton" role="status" aria-label="Loading lessons">
      <div className="learn-skeleton-line learn-skeleton-kicker" />
      <div className="learn-skeleton-line learn-skeleton-title" />
      <div className="learn-skeleton-line learn-skeleton-intro" />
      <article className="learn-skeleton-card">
        <div className="learn-skeleton-line learn-skeleton-kicker" />
        <div className="learn-skeleton-line learn-skeleton-card-title" />
        <div className="learn-skeleton-line" />
        <div className="learn-skeleton-line learn-skeleton-short" />
      </article>
      <article className="learn-skeleton-card">
        <div className="learn-skeleton-line learn-skeleton-kicker" />
        <div className="learn-skeleton-line learn-skeleton-card-title" />
        <div className="learn-skeleton-line" />
      </article>
    </div>
  );
}
