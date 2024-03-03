import * as d3 from "d3"
import * as _ from "lodash-es"

type Config = {
  width?: string | number;
  height?: string | number;
  angleAxis?: AngleAxis;
  radiusAxis?: RadiusAxis;
}

type AngleAxis = {
  startAngle?: number;
  endAngle?: number;
  scaleWeight?: number[];
}

type RadiusAxis = {
  categories: string[];
  padding?: number;
  innerPadding?: number;
  outerPadding?: number;
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
    },
    radiusAxis: {
      categories: ["A", "B", "C"],
      padding: 0.5
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

    this._initAngleAxix(finalConfig);
    this._initRadiusAxis(finalConfig);
  }

  _initAngleAxix(config: Config) {
    this.d3Svg
      .append("g")
      .attr("transform", `translate(${this._getCenter()[0]}, ${this._getCenter()[1]})`)
      .selectAll("path")
      .data(this._getAngleAxis(config))
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

  _initRadiusAxis(config: Config) {
    const bandScale = d3.scaleBand()
      .range([0, this._getRadius()])
      .domain(config.radiusAxis!.categories!)
      .padding(config.radiusAxis!.padding!);
    if (config.radiusAxis?.innerPadding) bandScale.paddingInner(config.radiusAxis?.innerPadding);
    if (config.radiusAxis?.outerPadding) bandScale.paddingInner(config.radiusAxis?.outerPadding);

    this.d3Svg
      .append("g")
      .attr("transform", `translate(0, ${this._getCenter()[1]})`)
      .call(d3.axisBottom(bandScale));
  }

  _getCenter() {
    return [this.d3Svg.node().clientWidth / 2, this.d3Svg.node().clientHeight / 2]
  }

  _getRadius() {
    return Math.min(this.d3Svg.node().clientWidth / 2, this.d3Svg.node().clientHeight / 2)
  }
}

export default Polar