import { Suspense } from "react";
import GenrePageClient from "../GenrePageClient";

export default function GenrePage() {
  return (
    <Suspense fallback={null}>
      <GenrePageClient />
    </Suspense>
  );
}
