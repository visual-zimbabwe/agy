import type { Metadata } from "next";
import { Suspense } from "react";

import { HelpCenter } from "@/components/help/HelpCenter";

export const metadata: Metadata = {
  title: "Help Center | Agy",
  description: "Task guidance, troubleshooting, and workflow help for Agy.",
};

export default function HelpPage() {
  return (
    <Suspense fallback={null}>
      <HelpCenter />
    </Suspense>
  );
}
