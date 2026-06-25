"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DEFAULT_TIME_RANGE_ID, getTimeRangeId, TIME_RANGE_OPTIONS } from "@/lib/time-range";
import type { TimeRangeId } from "@/lib/types";

export function TimeRangeSelector({ activeRange }: { activeRange: TimeRangeId }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRange = getTimeRangeId(searchParams.get("range") ?? activeRange);

  function updateRange(value: TimeRangeId) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === DEFAULT_TIME_RANGE_ID) {
      params.delete("range");
    } else {
      params.set("range", value);
    }

    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  return (
    <label className="time-range-control">
      <span>Periodo</span>
      <select value={selectedRange} onChange={(event) => updateRange(event.target.value as TimeRangeId)}>
        {TIME_RANGE_OPTIONS.map((option) => (
          <option value={option.id} key={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
