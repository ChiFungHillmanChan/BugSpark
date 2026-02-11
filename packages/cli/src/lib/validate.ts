const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateId(id: string): string {
  if (!UUID_REGEX.test(id)) {
    throw new Error(
      `Invalid ID format: "${id}". Expected a UUID (e.g. 550e8400-e29b-41d4-a716-446655440000).`
    );
  }
  return id;
}

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export function validateApiUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `Invalid API URL: "${url}". Expected a valid URL (e.g. https://api.example.com).`
    );
  }

  const isLocalhost = LOCALHOST_HOSTNAMES.has(parsed.hostname);

  if (!isLocalhost && parsed.protocol !== "https:") {
    throw new Error(
      `Insecure API URL: "${url}". Only HTTPS URLs are allowed (exceptions: localhost, 127.0.0.1).`
    );
  }

  return url;
}
