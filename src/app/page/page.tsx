import { Suspense } from "react";

import { PageEditor } from "@/components/page-editor/PageEditor";

export default function PageRoute() {
  return (
    <Suspense fallback={null}>
      <PageEditor />
    </Suspense>
  );
}
