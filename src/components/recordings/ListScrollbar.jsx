import React, { useLayoutEffect, useRef, useState } from 'react';

export function ListScrollbar({ viewport, scrollTop, contentHeight, regionId }) {
  const rail = useRef(null);
  const grab = useRef(null);
  const [size, setSize] = useState({ track: 0, page: 0, total: 0 });

  useLayoutEffect(() => {
    const view = viewport.current;
    const measure = () => setSize({ track: rail.current.clientHeight, page: view.clientHeight, total: view.scrollHeight });
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    observer.observe(rail.current);
    if (view.firstElementChild) observer.observe(view.firstElementChild);
    measure();
    return () => observer.disconnect();
  }, [viewport, contentHeight]);

  const range = Math.max(0, size.total - size.page);
  const thumb = Math.min(size.track, Math.max(46, size.track * size.page / (size.total || 1)));
  const travel = size.track - thumb;
  const top = range ? Math.min(1, scrollTop / range) * travel : 0;
  function move(event) {
    if (grab.current === null || !travel) return;
    const y = event.clientY - rail.current.getBoundingClientRect().top - grab.current;
    viewport.current.scrollTop = Math.max(0, Math.min(1, y / travel)) * range;
  }

  return (
    <div className="scroll-channel" data-active={range > 0}>
      <div ref={rail} className="scroll-track"
        role="scrollbar" aria-label="Scroll recordings" aria-controls={regionId} aria-orientation="vertical"
        aria-valuemin={0} aria-valuemax={Math.round(range)} aria-valuenow={Math.round(Math.min(range, scrollTop))}
        tabIndex={range ? 0 : -1}
        onPointerDown={event => {
          if (event.button !== 0 || !range) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          const y = event.clientY - rail.current.getBoundingClientRect().top;
          grab.current = y >= top && y <= top + thumb ? y - top : thumb / 2;
          move(event);
        }}
        onPointerMove={move}
        onLostPointerCapture={() => { grab.current = null; }}
        onWheel={event => {
          const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.page : 1;
          viewport.current.scrollTop += event.deltaY * unit;
        }}
        onKeyDown={event => {
          const offsets = { ArrowUp: -48, ArrowDown: 48, PageUp: -size.page, PageDown: size.page, Home: -range, End: range };
          if (!(event.key in offsets)) return;
          event.preventDefault();
          event.stopPropagation();
          viewport.current.scrollTop += offsets[event.key];
        }}
      >
        <span className="scroll-grip" style={{ top, height: thumb }} />
      </div>
    </div>
  );
}
