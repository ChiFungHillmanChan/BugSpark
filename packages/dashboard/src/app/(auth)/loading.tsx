import { Bug } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Bug className="w-8 h-8 text-accent animate-pulse" />
    </div>
  );
}
