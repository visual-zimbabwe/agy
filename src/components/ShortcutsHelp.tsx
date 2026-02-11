"use client";

type ShortcutsHelpProps = {
  open: boolean;
  onClose: () => void;
};

const shortcuts = [
  ["N / Ctrl+N", "New note"],
  ["Q / Ctrl+J", "Toggle quick capture bar"],
  ["P", "Toggle presentation mode"],
  ["Ctrl/Cmd + Enter", "Capture quick-capture lines as notes"],
  ["Enter", "Edit selected note text"],
  ["Ctrl+K", "Open search"],
  ["Ctrl+L", "Start link from selected note"],
  ["Ctrl/Cmd + A", "Select all visible notes"],
  ["T", "Toggle timeline mode"],
  ["H", "Toggle recently changed heatmap"],
  ["Ctrl/Cmd + Z", "Undo last change"],
  ["Ctrl/Cmd + Shift + Z", "Redo change"],
  ["Delete / Backspace", "Delete selected note, zone, link, or group"],
  ["Ctrl+D or Shift+D", "Duplicate selected note"],
  ["Alt + Drag", "Duplicate a note while dragging"],
  ["Shift + Drag", "Lock drag movement to one axis"],
  ["Space + Drag", "Pan wall"],
  ["Ctrl/Cmd + Wheel", "Zoom toward cursor"],
  ["Esc", "Clear selection and close overlays"],
  ["?", "Toggle this help"],
];

export const ShortcutsHelp = ({ open, onClose }: ShortcutsHelpProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Keyboard Shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-3 py-1 text-sm text-zinc-700"
          >
            Close
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {shortcuts.map(([combo, label]) => (
            <div key={combo} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
              <span className="font-medium text-zinc-800">{combo}</span>
              <span className="text-zinc-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
