import * as d3 from "d3"
import * as _ from "lodash-es"

type Config = {
  width?: string | number;
  height?: string | number;
  padding?: number;
  angleAxis?: AngleAxis;
  radiusAxis?: RadiusAxis;
  data: number[];
}

type AngleAxis = {
  startAngle?: number;
  endAngle?: number;
  scaleWeight?: number[];
  maxValue?: number;
  minValue?: number;
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
    padding: 25,
    angleAxis: {
      startAngle: 0,
      endAngle: Math.PI,
      scaleWeight: Array.from<number>({ length: 10 }).fill(1),
      maxValue: 100,
      minValue: 0,
    },
    radiusAxis: {
      categories: ["A", "B", "C"],
      padding: 0.5
    },
    data: [30, 50, 70]
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

    this._initAngleAxis(finalConfig);
    this._initRadiusAxis(finalConfig);
    this._initBar(finalConfig);
  }

  _initAngleAxis(config: Config) {
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
          outerRadius: this._getRadius(config),
          innerRadius: 0
        })
      })
      .attr("fill", "none")
      .attr("stroke", "#000")

    const ticks = this._getTicks(config);
    this.d3Svg
      .append("g")
      .selectAll("text")
      .data(ticks)
      .enter()
      .append("text")
      .text((tick) => tick.text)
      .attr("x", (tick) => tick.x)
      .attr("y", (tick) => tick.y)
      .attr("text-anchor", "end")
  }

  _getAngleAxis(config: Config) {
    const pie = d3.pie()
      .startAngle(config.angleAxis!.startAngle!)
      .endAngle(config.angleAxis!.endAngle!)
      .sort((a, b) => d3.ascending((a as any).index, (b as any).index));
    return pie(config.angleAxis!.scaleWeight!)
  }

  _getTicks(config: Config) {
    const radius = this._getRadius(config);
    const angleAxis = this._getAngleAxis(config);
    const svgCenter = this._getCenter();

    const xArray = angleAxis.map((item) => svgCenter[0] + radius * Math.cos(item.endAngle - Math.PI * 0.5));
    const yArray = angleAxis.map((item) => svgCenter[1] - radius * Math.sin(item.endAngle + Math.PI * 0.5));

    const range = config.angleAxis!.maxValue! - config.angleAxis!.minValue!;
    const rangePerTick = range / config.angleAxis!.scaleWeight!.length;
    return config.angleAxis!.scaleWeight!.map((item, index) => {
      return {
        text: (index + 1) * rangePerTick,
        x: xArray[index],
        y: yArray[index],
      }
    })
  }

  _initRadiusAxis(config: Config) {
    const bandScale = d3.scaleBand()
      .range([0, this._getRadius(config)])
      .domain(config.radiusAxis!.categories!)
      .padding(config.radiusAxis!.padding!);
    if (config.radiusAxis?.innerPadding) bandScale.paddingInner(config.radiusAxis?.innerPadding);
    if (config.radiusAxis?.outerPadding) bandScale.paddingInner(config.radiusAxis?.outerPadding);

    this.d3Svg
      .append("g")
      .attr("transform", `translate(${this._getCenter()[0] - this._getRadius(config)}, ${this._getCenter()[1]})`)
      .call(d3.axisBottom(bandScale));
  }

  _initBar(config: Config) {
    const domainRange = config.angleAxis!.maxValue! - config.angleAxis!.minValue!;
    const domain = config.angleAxis!.scaleWeight!.reduce<number[]>((acc, cur, index) => {
      acc.push((index + 1) * (domainRange / config.angleAxis!.scaleWeight!.length));
      return acc
    }, [config.angleAxis!.minValue!]);

    const angleAxis = this._getAngleAxis(config);
    const range = angleAxis.reduce<number[]>((acc, cur, index) => {
      acc.push(cur.endAngle);
      return acc
    }, [config.angleAxis!.startAngle!]);

    const linearScale = d3.scaleLinear().domain(domain).range(range);
    const bandScale = d3.scaleBand()
      .range([0, this._getRadius(config)])
      .domain(config.radiusAxis!.categories!)
      .padding(config.radiusAxis!.padding!);
    this.d3Svg
      .append("g")
      .attr("transform", `translate(${this._getCenter()[0]}, ${this._getCenter()[1]})`)
      .selectAll("path")
      .data(config.radiusAxis!.categories)
      .enter()
      .append("path")
      .attr("d", (data: string, index) => {
        return d3.arc()({
          startAngle: config.angleAxis!.startAngle!,
          endAngle: linearScale(config.data[index])!,
          outerRadius: this._getRadius(config) - bandScale(data)!,
          innerRadius: this._getRadius(config) - bandScale(data)! - bandScale.bandwidth()
        })
      })
      .attr("fill", `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`)
  }

  _getCenter() {
    return [this.d3Svg.node().clientWidth / 2, this.d3Svg.node().clientHeight / 2]
  }

  _getRadius(config: Config) {
    const padding = config.padding!
    return Math.min(this.d3Svg.node().clientWidth / 2, this.d3Svg.node().clientHeight / 2) - padding
  }
}

export default Polar