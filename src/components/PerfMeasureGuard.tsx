"use client";

import { useEffect } from "react";

export default function PerfMeasureGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof performance === "undefined" || typeof performance.measure !== "function") return;
    const original = performance.measure.bind(performance) as (...a: any[]) => any;
    performance.measure = ((...args: any[]) => {
      try {
        // Safari/Extensions können fehlerhafte Marks/negative Zeiten verursachen
        return original.apply(performance, args);
      } catch {
        return undefined as any;
      }
    }) as any;
    return () => {
      try {
        performance.measure = original as any;
      } catch {
        // ignore
      }
    };
  }, []);
  return null;
}


