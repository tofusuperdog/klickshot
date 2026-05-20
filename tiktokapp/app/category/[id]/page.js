import { Suspense } from "react";
import CategoryPageClient from "../CategoryPageClient";

export default function CategoryPage() {
  return (
    <Suspense fallback={null}>
      <CategoryPageClient />
    </Suspense>
  );
}
