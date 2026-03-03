type DesktopPickSavePathPayload = {
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
};

type DesktopPickSavePathResult = {
  canceled: boolean;
  filePath: string | null;
};

type DesktopPickFolderResult = {
  canceled: boolean;
  folderPath: string | null;
};

type DesktopWriteInFolderResult =
  | { status: "written"; filePath: string }
  | { status: "skipped" }
  | { status: "canceled" }
  | { status: "error"; error: string };

type DesktopOpenPathResult = {
  ok: boolean;
  error?: string;
};

type DesktopSaveFileResult = {
  ok: boolean;
  filePath?: string;
  error?: string;
};

type DesktopApi = {
  pickSavePath: (payload: DesktopPickSavePathPayload) => Promise<DesktopPickSavePathResult>;
  pickFolder: () => Promise<DesktopPickFolderResult>;
  saveFile: (payload: { filePath: string; base64: string }) => Promise<DesktopSaveFileResult>;
  writeInFolder: (payload: { folderPath: string; fileName: string; base64: string }) => Promise<DesktopWriteInFolderResult>;
  openPath: (payload: { path: string }) => Promise<DesktopOpenPathResult>;
};

declare global {
  interface Window {
    desktopMeta?: {
      platform: string;
      isDesktop: boolean;
    };
    desktopApi?: DesktopApi;
  }
}

export {};
