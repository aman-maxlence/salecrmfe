import { ReactNode, useLayoutEffect, useRef } from 'react';

/**
 * Shows only `visibleCount` of its children at once, in an overflow-hidden
 * viewport - the rest sit below, out of view, until `activeIndex` advances
 * far enough that they need to scroll into frame. Height and position come
 * from measuring the actual rows (their heights vary: a collapsed "done"
 * field is much shorter than an "active" one with its label/description),
 * so both the viewport height and the upward slide animate smoothly on
 * every step change instead of jumping.
 */
export function SlidingFieldWindow({
  activeIndex,
  visibleCount = 3,
  children,
}: {
  activeIndex: number;
  visibleCount?: number;
  children: ReactNode[];
}) {
  const total = children.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Keep the active row visible with one row of context above it, but never
  // scroll past the point where the last row would leave a gap at the bottom.
  const maxStart = Math.max(total - visibleCount, 0);
  const startIndex = Math.min(Math.max(activeIndex - 1, 0), maxStart);
  const endIndex = Math.min(startIndex + visibleCount - 1, total - 1);

  useLayoutEffect(() => {
    const first = rowRefs.current[startIndex];
    const last = rowRefs.current[endIndex];
    if (!first || !last || !containerRef.current || !trackRef.current) return;

    const offset = first.offsetTop;
    const height = last.offsetTop + last.offsetHeight - first.offsetTop;

    trackRef.current.style.transform = `translateY(-${offset}px)`;
    containerRef.current.style.height = `${height}px`;
  });

  return (
    <div ref={containerRef} className="overflow-hidden transition-[height] duration-300 ease-in-out">
      <div ref={trackRef} className="flex flex-col gap-10 transition-transform duration-300 ease-in-out">
        {children.map((child, i) => (
          <div key={i} ref={(el) => (rowRefs.current[i] = el)}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
