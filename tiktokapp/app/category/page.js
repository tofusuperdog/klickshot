import { Suspense } from "react";
import CategoryPageClient from "./CategoryPageClient";

export default function CategoryQueryPage() {
  return (
    <Suspense fallback={null}>
      <CategoryPageClient />
    </Suspense>
  );
}
