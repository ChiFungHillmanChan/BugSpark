/**
 * Safely extract an error message from an unknown thrown value.
 */
export function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
