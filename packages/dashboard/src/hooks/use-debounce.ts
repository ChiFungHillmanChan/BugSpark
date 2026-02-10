import { useEffect, useState } from "react";

/**
 * Returns a debounced version of `value` that only updates
 * after the caller stops changing it for `delay` milliseconds.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
