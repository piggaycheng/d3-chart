import * as d3 from "d3"


interface Config {
  width?: string | number;
  height?: string | number;
}

export default class {
  d3Svg: d3.Selection<any, unknown, null, undefined>;

  constructor(el: string | d3.BaseType, config?: Config) {
    this.d3Svg = d3.select(el as any)
      .attr("width", config?.width ?? 200)
      .attr("height", config?.height ?? 100);
  }
}

