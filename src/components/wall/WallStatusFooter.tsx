"use client";

type WallStatusFooterProps = {
  publishedReadOnly: boolean;
  hasCloudWall: boolean;
  isSyncing: boolean;
  hasPendingSync: boolean;
  syncError: string | null;
};

export const WallStatusFooter = ({
  publishedReadOnly,
  hasCloudWall,
  isSyncing,
  hasPendingSync,
  syncError,
}: WallStatusFooterProps) => {
  const label = publishedReadOnly
    ? "Read-only snapshot"
    : syncError
      ? "Sync needs attention"
      : isSyncing
        ? "Syncing to Atelier"
        : hasPendingSync
          ? "Changes pending sync"
          : hasCloudWall
            ? "Synced to Atelier"
            : "Stored locally";

  return (
    <footer className="pointer-events-none absolute bottom-6 left-7 z-[32] hidden sm:block">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f867f]">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-white/72 shadow-[0_4px_12px_rgba(28,28,25,0.06)]">
          <span className={`h-1.5 w-1.5 rounded-full ${syncError ? "bg-[#a33818]" : "bg-[#7a9a87]"}`} />
        </span>
        <span>{label}</span>
      </div>
    </footer>
  );
};
