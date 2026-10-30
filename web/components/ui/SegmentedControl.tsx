"use client";

export function SegmentedControl({ label, value, items, onChange }: { label: string; value: string; items: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <div className="q-ui-segments" role="group" aria-label={label} onKeyDown={event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    event.preventDefault(); onChange(items[next].value);
    buttons[next]?.focus();
  }}>{items.map(item => <button type="button" key={item.value} aria-pressed={item.value === value} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>;
}
