import * as d3 from "d3"
import * as _ from "lodash-es"

type Config = {
  width?: string | number;
  height?: string | number;
  angleAxis?: AngleAxis;
}

type AngleAxis = {
  startAngle?: number;
  endAngle?: number;
  scaleWeight?: number[];
}

class Polar {
  d3Svg: d3.Selection<any, unknown, null, undefined>;
  defaultConfig: Config = {
    width: 300,
    height: 150,
    angleAxis: {
      startAngle: 0,
      endAngle: Math.PI,
      scaleWeight: Array.from<number>({ length: 10 }).fill(1)
    }
  };

  constructor(el: string | d3.BaseType, config?: Config) {
    const finalConfig = _.mergeWith(this.defaultConfig, config, function (objValue, srcValue) {
      if (_.isArray(objValue)) {
        return srcValue;
      }
    });

    this.d3Svg = d3.select(el as any)
      .attr("width", finalConfig!.width!)
      .attr("height", finalConfig!.height!)

    this.d3Svg
      .append("g")
      .attr("transform", `translate(${this._getCenter()[0]}, ${this._getCenter()[1]})`)
      .selectAll("path")
      .data(this._getAngleAxis(finalConfig))
      .enter()
      .append("path")
      .attr("d", (data: any) => {
        return d3.arc()({
          ...data,
          outerRadius: this._getRadius(),
          innerRadius: 0
        })
      })
      .attr("fill", "none")
      .attr("stroke", "#000")
  }

  _getAngleAxis(config: Config) {
    const pie = d3.pie()
      .startAngle(config.angleAxis!.startAngle!)
      .endAngle(config.angleAxis!.endAngle!)
      .sort((a, b) => d3.ascending((a as any).index, (b as any).index));
    return pie(config.angleAxis!.scaleWeight!)
  }

  _initRadiusAxis() {
    // TODO
  }

  _getCenter() {
    return [this.d3Svg.node().clientWidth / 2, this.d3Svg.node().clientHeight / 2]
  }

  _getRadius() {
    return Math.min(this.d3Svg.node().clientWidth / 2, this.d3Svg.node().clientHeight / 2)
  }
}

export default Polar