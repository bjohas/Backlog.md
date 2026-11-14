import React, { useRef, useState } from 'react';

interface BoardColumnsProps {
  statuses: string[];
  /** Cards in each status, shown on the phone tabs. */
  taskCounts: number[];
  /** How the columns sit side by side from the sm breakpoint up: the plain board's scrolling row or a milestone lane's grid. */
  layout: 'row' | 'grid';
  renderColumn: (status: string) => React.ReactNode;
}

/**
 * Lays out the board's columns. Below the sm breakpoint each column fills the screen width, a
 * sideways swipe snaps to the next one, and tabs with the column names jump to a column. From sm
 * up the columns sit side by side as before.
 */
export default function BoardColumns({ statuses, taskCounts, layout, renderColumn }: BoardColumnsProps) {
  // The element that scrolls sideways: the row's wrapper, or the lane grid itself.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const showColumn = (index: number) => {
    setActiveIndex(index);
    columnRefs.current[index]?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  // After a swipe the active tab is the column nearest the scroller's left edge.
  const followSwipe = () => {
    const scrollerLeft = scrollerRef.current?.getBoundingClientRect().left ?? 0;
    const distances = statuses.map((_, index) =>
      Math.abs((columnRefs.current[index]?.getBoundingClientRect().left ?? Number.POSITIVE_INFINITY) - scrollerLeft)
    );
    setActiveIndex(distances.indexOf(Math.min(...distances)));
  };

  const snapClass = 'max-sm:snap-x max-sm:snap-mandatory';
  const columns = statuses.map((status, index) => (
    <div
      key={status}
      ref={(element) => {
        columnRefs.current[index] = element;
      }}
      className={`max-sm:w-full max-sm:shrink-0 max-sm:snap-start ${layout === 'row' ? 'sm:flex-1 sm:min-w-[16rem]' : 'min-w-0'}`}
    >
      {renderColumn(status)}
    </div>
  ));

  return (
    <div>
      <div className="sm:hidden flex gap-1 overflow-x-auto mb-3" role="tablist" aria-label="Board columns">
        {statuses.map((status, index) => (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            onClick={() => showColumn(index)}
            className={`shrink-0 px-3 py-1.5 text-sm font-medium rounded-md border whitespace-nowrap transition-colors duration-200 ${
              index === activeIndex
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm border-gray-200 dark:border-gray-600'
                : 'text-gray-600 dark:text-gray-400 border-transparent'
            }`}
          >
            {status} <span className="text-xs text-gray-500 dark:text-gray-400">{taskCounts[index] ?? 0}</span>
          </button>
        ))}
      </div>
      {layout === 'row' ? (
        <div ref={scrollerRef} className={`overflow-x-auto pb-2 ${snapClass}`} onScroll={followSwipe}>
          <div className="flex flex-row flex-nowrap gap-4 w-full">{columns}</div>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className={`flex gap-4 max-sm:overflow-x-auto sm:grid ${snapClass}`}
          style={{ gridTemplateColumns: `repeat(${statuses.length}, minmax(0, 1fr))` }}
          onScroll={followSwipe}
        >
          {columns}
        </div>
      )}
    </div>
  );
}
