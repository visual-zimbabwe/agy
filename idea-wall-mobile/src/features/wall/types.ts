export type Note = {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  createdAt: number;
  updatedAt: number;
};

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

export type WallUI = {
  selectedNoteId?: string;
  lastColor?: string;
};

export type WallState = {
  notes: Record<string, Note>;
  camera: Camera;
  ui: WallUI;
};

export type PersistedWallState = Pick<WallState, "notes" | "camera"> & {
  lastColor?: string;
};
