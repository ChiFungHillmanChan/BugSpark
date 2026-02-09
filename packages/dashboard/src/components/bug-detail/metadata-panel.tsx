interface MetadataPanelProps {
  metadata: Record<string, unknown> | null;
}

const DISPLAY_KEYS: { key: string; label: string }[] = [
  { key: "userAgent", label: "User Agent" },
  { key: "platform", label: "Platform" },
  { key: "viewport", label: "Viewport" },
  { key: "screenResolution", label: "Screen Resolution" },
  { key: "url", label: "URL" },
  { key: "referrer", label: "Referrer" },
  { key: "locale", label: "Locale" },
  { key: "timezone", label: "Timezone" },
  { key: "connection", label: "Connection" },
  { key: "memory", label: "Memory" },
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("width" in obj && "height" in obj) {
      return `${obj.width} x ${obj.height}`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

export function MetadataPanel({ metadata }: MetadataPanelProps) {
  if (!metadata) {
    return (
      <p className="text-gray-400 text-sm py-4 text-center">
        No device metadata
      </p>
    );
  }

  const allKeys = new Set([
    ...DISPLAY_KEYS.map((d) => d.key),
    ...Object.keys(metadata),
  ]);

  const displayEntries = DISPLAY_KEYS.filter(
    ({ key }) => metadata[key] !== undefined,
  );

  const extraKeys = Object.keys(metadata).filter(
    (key) => !DISPLAY_KEYS.some((d) => d.key === key),
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {displayEntries.map(({ key, label }) => (
        <div key={key}>
          <dt className="text-xs text-gray-400 font-medium">{label}</dt>
          <dd className="text-sm text-gray-900 mt-0.5 truncate">
            {formatValue(metadata[key])}
          </dd>
        </div>
      ))}
      {extraKeys.map((key) => (
        <div key={key}>
          <dt className="text-xs text-gray-400 font-medium capitalize">
            {key.replace(/([A-Z])/g, " $1").trim()}
          </dt>
          <dd className="text-sm text-gray-900 mt-0.5 truncate">
            {formatValue(metadata[key])}
          </dd>
        </div>
      ))}
      {allKeys.size === 0 && (
        <p className="col-span-2 text-gray-400 text-sm py-4 text-center">
          No device metadata
        </p>
      )}
    </div>
  );
}
