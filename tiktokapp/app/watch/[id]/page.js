import { Suspense } from "react";
import WatchPageClient from "../WatchPageClient";

export default function WatchPage() {
  return (
    <Suspense fallback={null}>
      <WatchPageClient />
    </Suspense>
  );
}
