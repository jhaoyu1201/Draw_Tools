
export enum PerspectiveMode {
  ONE_POINT = 1,
  TWO_POINT = 2,
  THREE_POINT = 3,
  FOUR_POINT = 4
}

export interface Point {
  x: number; // 相對於圖片中心點的座標
  y: number;
}

export interface AppState {
  image: HTMLImageElement | null;
  mode: PerspectiveMode;
  vanishingPoints: Point[];
  lineDensity: number;
  lineColor: string;
  lineWidth: number;
  workspaceZoom: number; // 工作區縮放倍率
}
