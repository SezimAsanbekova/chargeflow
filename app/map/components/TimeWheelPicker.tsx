"use client";
import { useRef, useEffect, useCallback } from "react";

interface TimeWheelPickerProps {
  slots: string[];
  value: string;
  onChange: (time: string) => void;
}

const ITEM_H = 38;
const VISIBLE = 3;

function Wheel({
  items,
  selected,
  onSelect,
  pad,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
  pad?: boolean;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const isTouching = useRef(false);
  const skipScroll = useRef(false);

  const scrollTo = useCallback(
    (idx: number, smooth = true) => {
      if (!listRef.current) return;
      skipScroll.current = true;
      listRef.current.scrollTo({
        top: idx * ITEM_H,
        behavior: smooth ? "smooth" : "auto",
      });
      setTimeout(() => {
        skipScroll.current = false;
      }, 400);
    },
    []
  );

  // Scroll to selected item on mount / when selected changes externally
  useEffect(() => {
    if (isTouching.current) return;
    const idx = items.indexOf(selected);
    if (idx !== -1) scrollTo(idx, false);
  }, [selected, items, scrollTo]);

  const handleScroll = useCallback(() => {
    if (skipScroll.current || !listRef.current) return;
    const idx = Math.round(listRef.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (items[clamped] !== selected) onSelect(items[clamped]);
  }, [items, selected, onSelect]);

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 64, height: ITEM_H * VISIBLE }}
    >
      {/* top / bottom fade */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `linear-gradient(to bottom,
            #0a1f1a 0%,
            transparent ${100 / VISIBLE}%,
            transparent ${100 - 100 / VISIBLE}%,
            #0a1f1a 100%)`,
        }}
      />
      {/* center highlight bar */}
      <div
        className="pointer-events-none absolute left-0 right-0 z-10 rounded-lg border border-emerald-500/30 bg-emerald-500/10"
        style={{
          top: ITEM_H * Math.floor(VISIBLE / 2),
          height: ITEM_H,
        }}
      />
      <ul
        ref={listRef}
        onScroll={handleScroll}
        onTouchStart={() => {
          isTouching.current = true;
        }}
        onTouchEnd={() => {
          isTouching.current = false;
        }}
        className="absolute inset-0 overflow-y-scroll"
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          // padding so first/last items can centre
          paddingTop: ITEM_H * Math.floor(VISIBLE / 2),
          paddingBottom: ITEM_H * Math.floor(VISIBLE / 2),
        }}
      >
        {items.map((item) => (
          <li
            key={item}
            onClick={() => {
              const idx = items.indexOf(item);
              scrollTo(idx);
              onSelect(item);
            }}
            style={{
              scrollSnapAlign: "center",
              height: ITEM_H,
              lineHeight: `${ITEM_H}px`,
            }}
            className={`cursor-pointer select-none text-center text-xl font-medium transition-colors ${
              item === selected
                ? "text-emerald-400 font-semibold"
                : "text-gray-500"
            }`}
          >
            {pad ? item.padStart(2, "0") : item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TimeWheelPicker({ slots, value, onChange }: TimeWheelPickerProps) {
  // Derive unique hours and minutes from the slot list
  const hours = Array.from(new Set(slots.map((s) => s.split(":")[0]))).sort();
  const selectedHour = value ? value.split(":")[0] : hours[0] ?? "00";
  const minutesForHour = slots
    .filter((s) => s.split(":")[0] === selectedHour)
    .map((s) => s.split(":")[1]);
  const selectedMinute = value ? value.split(":")[1] : minutesForHour[0] ?? "00";

  const handleHourChange = (h: string) => {
    // pick first available minute for new hour
    const mins = slots
      .filter((s) => s.split(":")[0] === h)
      .map((s) => s.split(":")[1]);
    const m = mins.includes(selectedMinute) ? selectedMinute : (mins[0] ?? "00");
    onChange(`${h}:${m}`);
  };

  const handleMinuteChange = (m: string) => {
    onChange(`${selectedHour}:${m}`);
  };

  if (slots.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
        Нет доступных слотов
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-0 select-none">
      <Wheel
        items={hours}
        selected={selectedHour}
        onSelect={handleHourChange}
        pad
      />
      <div className="text-emerald-400 font-bold text-2xl pb-1 px-1">:</div>
      <Wheel
        items={minutesForHour}
        selected={selectedMinute}
        onSelect={handleMinuteChange}
        pad
      />
    </div>
  );
}
