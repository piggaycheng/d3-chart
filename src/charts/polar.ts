import * as d3 from "d3"
import * as _ from "lodash-es"

type Config = PolarTypes.Config
type ClickLabelEvent = PolarTypes.ClickLabelEvent
type ClickDataEvent = PolarTypes.ClickDataEvent

class Polar {
  private _d3Svg: d3.Selection<any, unknown, null, undefined>;
  private _defaultConfig: Config = {
    type: "polar",
    width: 300,
    height: 150,
    padding: 25,
    angleAxis: {
      startAngle: 0,
      endAngle: Math.PI,
      scaleWeight: Array.from<number>({ length: 10 }).fill(1),
      maxValue: 100,
      minValue: 0,
      tick: {
        distance: 5
      }
    },
    radiusAxis: {
      categories: ["A", "B", "C"],
      padding: 0.5
    },
    data: {
      dataset: [30, 50, 70]
    }
  };
  private _finalConfig: Config;
  private _bars: d3.Selection<SVGGElement, unknown, null, undefined>;
  private _radiusAxisBandScale: d3.ScaleBand<string>;
  private _barText: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(el: string | d3.BaseType, config?: Config) {
    const finalConfig = _.mergeWith(this._defaultConfig, config, function (objValue, srcValue) {
      if (_.isArray(objValue)) {
        return srcValue;
      }
    });
    this._finalConfig = finalConfig;

    this._d3Svg = d3.select(el as any)
      .attr("width", finalConfig!.width!)
      .attr("height", finalConfig!.height!)

    this._initAngleAxis(finalConfig);
    this._initRadiusAxis(finalConfig);
    this._initBar(finalConfig);
  }

  private _initAngleAxis(config: Config) {
    this._d3Svg
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
    this._d3Svg
      .append("g")
      .selectAll("text")
      .data(ticks)
      .enter()
      .append("text")
      .text((tick) => tick.text)
      .attr("x", (tick) => tick.x)
      .attr("y", (tick) => tick.y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");
  }

  private _getAngleAxis(config: Config) {
    const pie = d3.pie()
      .startAngle(config.angleAxis!.startAngle!)
      .endAngle(config.angleAxis!.endAngle!)
      .sort((a, b) => d3.ascending((a as any).index, (b as any).index));
    return pie(config.angleAxis!.scaleWeight!)
  }

  private _getTicks(config: Config) {
    const radius = this._getRadius(config) + config.angleAxis!.tick!.distance!;
    const angleAxis = this._getAngleAxis(config);
    const svgCenter = this._getCenter();

    const ticks = d3.scaleLinear().domain([config.angleAxis!.minValue!, config.angleAxis!.maxValue!]).ticks(config.angleAxis!.scaleWeight!.length);
    const xArray = ticks.reduce<number[]>((acc, cur, index) => {
      if (index === 0) return acc
      acc.push(svgCenter[0] + radius * Math.cos(angleAxis[index - 1].endAngle - Math.PI * 0.5))
      return acc
    }, [svgCenter[0] + radius * Math.cos(config.angleAxis!.startAngle! - Math.PI * 0.5)]);
    const yArray = ticks.reduce<number[]>((acc, cur, index) => {
      if (index === 0) return acc
      acc.push(svgCenter[1] - radius * Math.sin(angleAxis[index - 1].endAngle + Math.PI * 0.5))
      return acc
    }, [svgCenter[1] - radius * Math.sin(config.angleAxis!.startAngle! + Math.PI * 0.5)]);

    return ticks.map((tick, index) => {
      return {
        text: tick,
        x: xArray[index],
        y: yArray[index],
      }
    })
  }

  private _initRadiusAxis(config: Config) {
    let bandScale = this._radiusAxisBandScale;
    if (!bandScale) {
      bandScale = d3.scaleBand()
        .range([0, this._getRadius(config)])
        .domain(config.radiusAxis!.categories!)
        .padding(config.radiusAxis!.padding!);
      if (config.radiusAxis?.innerPadding) bandScale.paddingInner(config.radiusAxis?.innerPadding);
      if (config.radiusAxis?.outerPadding) bandScale.paddingOuter(config.radiusAxis?.outerPadding);
      this._radiusAxisBandScale = bandScale;
    }

    this._d3Svg
      .append("g")
      .attr("transform", `translate(${this._getCenter()[0] - this._getRadius(config)}, ${this._getCenter()[1]})`)
      .call(d3.axisBottom(bandScale))
      .selectAll(".tick")
      .style("cursor", "pointer")
      .each(function (p, i) {
        d3.select(this)
          .on("click", (e: PointerEvent) => {
            if (!config.radiusAxis?.click) return;
            const clickEvent: ClickLabelEvent = {
              event: e,
              index: i,
              category: config.radiusAxis.categories[i],
              value: config.data.dataset[i],
            }
            config.radiusAxis.click(clickEvent)
          })
      })
  }

  private _initBar(config: Config) {
    const domain = d3.scaleLinear().domain([config.angleAxis!.minValue!, config.angleAxis!.maxValue!]).ticks(config.angleAxis!.scaleWeight!.length);
    const angleAxis = this._getAngleAxis(config);
    const range = angleAxis.reduce<number[]>((acc, cur, index) => {
      acc.push(cur.endAngle);
      return acc
    }, [config.angleAxis!.startAngle!]);

    const linearScale = d3.scaleLinear().domain(domain).range(range);
    const bandScale = this._radiusAxisBandScale;

    let bars = this._bars;
    if (!bars) {
      bars = this._d3Svg
        .append("g")
        .attr("transform", `translate(${this._getCenter()[0]}, ${this._getCenter()[1]})`);
      this._bars = bars;
    }

    bars
      .selectAll("path")
      .data(config.radiusAxis!.categories)
      .join("path")
      .on("click", (e: PointerEvent) => {
        if (!config.data.click) return;
        const clickEvent: ClickDataEvent = {
          event: e,
          index: Number((e.target as HTMLElement).dataset.index),
          category: (e.target as HTMLElement).dataset.category!,
          value: Number((e.target as HTMLElement).dataset.value),
        }
        config.data.click(clickEvent)
      })
      .attr("fill", `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`)
      .attr("fill-opacity", 1)
      .attr("data-index", (data: string, index) => index)
      .attr("data-category", (data: string, index) => data)
      .attr("data-value", (data: string, index) => config.data.dataset[index])
      .style("cursor", "pointer")
      .transition()
      .duration(1000)
      .attrTween("d", (data: string, index) => {
        const interpolate = d3.interpolateNumber(config.angleAxis!.startAngle!, linearScale(config.data.dataset[index])!)
        return (t) => {
          return d3.arc()({
            startAngle: config.angleAxis!.startAngle!,
            endAngle: interpolate(t),
            outerRadius: this._getRadius(config) - bandScale(data)!,
            innerRadius: this._getRadius(config) - bandScale(data)! - bandScale.bandwidth()
          })!
        }
      })

    this._initBarText(bars, linearScale, config);
  }

  private _initBarText(bars: d3.Selection<SVGGElement, unknown, null, undefined>, linearScale: d3.ScaleLinear<number, number, never>, config: Config) {
    const radius = this._getRadius(config);
    const svgCenter = this._getCenter();
    const bandScale = this._radiusAxisBandScale;

    let barText = this._barText;
    if (!barText) {
      barText = this._d3Svg
        .append("g")
      this._barText = barText;
    }

    barText
      .selectAll("text")
      .data(config.data.dataset)
      .join("text")
      .attr("x", (data: number, index) => {
        const middle = (linearScale(data) + config.angleAxis!.startAngle!) / 2;
        return svgCenter[0] + (radius - bandScale(config.radiusAxis!.categories![index])! - 0.5 * bandScale.bandwidth()) * Math.cos(middle - Math.PI * 0.5)
      })
      .attr("y", (data: number, index) => {
        const middle = (linearScale(data) + config.angleAxis!.startAngle!) / 2;
        return svgCenter[1] - (radius - bandScale(config.radiusAxis!.categories![index])! - 0.5 * bandScale.bandwidth()) * Math.sin(middle + Math.PI * 0.5)
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text((data) => data)
  }

  private _getCenter() {
    return [this._d3Svg.node().clientWidth / 2, this._d3Svg.node().clientHeight / 2]
  }

  private _getRadius(config: Config) {
    const padding = config.padding!
    return Math.min(this._d3Svg.node().clientWidth / 2, this._d3Svg.node().clientHeight / 2) - padding
  }

  update(dataset: number[]) {
    this._finalConfig.data.dataset = dataset;
    this._initBar(this._finalConfig);
  }
}

export default Polar