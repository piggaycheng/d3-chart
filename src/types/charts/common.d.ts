declare namespace Chart {
  type ChartType = "polar" | "worldMap"

  interface Config {
    type: ChartType
  }
}