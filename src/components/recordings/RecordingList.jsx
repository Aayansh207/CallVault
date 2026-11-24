import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatHoursMinutes, getDateHeaderGroup } from '../../lib/formatters';
import { ListScrollbar } from './ListScrollbar';
import { RecordingRow } from './RecordingRow';

const ROW_HEIGHT = 64;
const HEADER_HEIGHT = 38;
const OVERSCAN = ROW_HEIGHT * 6;

export function RecordingList({ recordings, groupByDate, searchHighlight, listKey, busy, children }) {
  const { openNoteModal, openTagModal, openDeleteModal, refreshData } = useApp();
  const regionId = useId();
  const viewport = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const element = viewport.current;
    const resize = () => setHeight(element.clientHeight);
    const observer = new ResizeObserver(resize);
    resize();
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    viewport.current.scrollTop = 0;
    setScrollTop(0);
  }, [listKey]);

  const { entries, totalHeight } = useMemo(() => {
    const entries = [];
    let top = 0;
    let group;
    for (const recording of recordings) {
      if (groupByDate) {
        const date = recording.recorded_at?.slice(0, 10);
        if (!group || group.date !== date) {
          group = { date, top, height: HEADER_HEIGHT, count: 0, seconds: 0 };
          entries.push(group);
          top += HEADER_HEIGHT;
        }
        group.count += 1;
        group.seconds += recording.duration_seconds || 0;
      }
      entries.push({ recording, top, height: ROW_HEIGHT });
      top += ROW_HEIGHT;
    }
    return { entries, totalHeight: top };
  }, [recordings, groupByDate]);

  // Locate the first nearby item without walking past every offscreen row.
  let first = 0;
  let end = entries.length;
  const visibleTop = Math.min(scrollTop, Math.max(0, totalHeight - height)) - OVERSCAN;
  while (first < end) {
    const middle = (first + end) >>> 1;
    const entry = entries[middle];
    if (entry.top + entry.height <= visibleTop) first = middle + 1;
    else end = middle;
  }

  const visible = [];
  for (let index = first; index < entries.length; index++) {
    const { recording, date, top, height: entryHeight, count, seconds } = entries[index];
    if (top > visibleTop + height + OVERSCAN * 2) break;
    visible.push(
      <div className="recording-slot" key={recording ? recording.id : `date-${date}`} style={{ top, height: entryHeight }}>
        {recording ? (
          <RecordingRow
            recording={recording}
            playlist={recordings}
            searchHighlight={searchHighlight}
            onOpenNote={openNoteModal}
            onOpenTags={openTagModal}
            onOpenDelete={openDeleteModal}
            onUpdated={refreshData}
          />
        ) : (
          <div className="recording-date">
            <h2>{getDateHeaderGroup(date && `${date}T00:00:00`)}</h2>
            <span>{count} {count === 1 ? 'call' : 'calls'} · {formatHoursMinutes(seconds)}</span>
          </div>
        )}
      </div>,
    );
  }

  return (
    <div className="list-frame">
    <div
      id={regionId}
      className="workspace-scroll recording-scroll"
      ref={viewport}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      tabIndex={0}
      role="region"
      aria-label="Recordings"
      aria-busy={busy}
    >
      {children || <div className="relative" style={{ height: totalHeight }}>{visible}</div>}
    </div>
    <ListScrollbar viewport={viewport} scrollTop={scrollTop} contentHeight={totalHeight} regionId={regionId} />
    </div>
  );
}
