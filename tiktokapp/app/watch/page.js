import { Suspense } from "react";
import WatchPageClient from "./WatchPageClient";

export default function WatchQueryPage() {
  return (
    <Suspense fallback={null}>
      <WatchPageClient />
    </Suspense>
  );
}
