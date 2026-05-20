import { Suspense } from "react";
import GenrePageClient from "./GenrePageClient";

export default function GenreQueryPage() {
  return (
    <Suspense fallback={null}>
      <GenrePageClient />
    </Suspense>
  );
}
