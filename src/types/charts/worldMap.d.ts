declare namespace WorldMapType {
  interface Config extends Chart.Config {
    width?: number;
    height?: number;
    map: MapConfig;
  }

  interface MapConfig {
    angle: number
  }
}