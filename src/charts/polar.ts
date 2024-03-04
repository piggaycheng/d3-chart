import * as d3 from "d3"
import * as _ from "lodash-es"

type Config = {
  width?: string | number;
  height?: string | number;
  padding?: number;
  angleAxis?: AngleAxis;
  radiusAxis?: RadiusAxis;
  data: Data;
}

type AngleAxis = {
  startAngle?: number;
  endAngle?: number;
  scaleWeight?: number[];
  maxValue?: number;
  minValue?: number;
  tick?: Tick;
}

type Tick = {
  distance?: number;
}

type RadiusAxis = {
  categories: string[];
  padding?: number;
  innerPadding?: number;
  outerPadding?: number;
}

type Data = {
  dataset: number[];
  click?: (e: ClickDataEvent) => void;
}

interface ClickEvent {
  event: PointerEvent;
}

interface ClickDataEvent extends ClickEvent {
  index: number;
  value: number | string;
  category: string;
}

class Polar {
  private _d3Svg: d3.Selection<any, unknown, null, undefined>;
  private _defaultConfig: Config = {
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
      .attr("text-anchor", (tick) => tick.textSetting.anchor)
      .attr("dominant-baseline", (tick) => tick.textSetting.baseline)
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

    const xArray = angleAxis.map((item) => svgCenter[0] + radius * Math.cos(item.endAngle - Math.PI * 0.5));
    const yArray = angleAxis.map((item) => svgCenter[1] - radius * Math.sin(item.endAngle + Math.PI * 0.5));

    const range = config.angleAxis!.maxValue! - config.angleAxis!.minValue!;
    const rangePerTick = range / config.angleAxis!.scaleWeight!.length;
    return config.angleAxis!.scaleWeight!.map((item, index) => {
      return {
        text: (index + 1) * rangePerTick,
        x: xArray[index],
        y: yArray[index],
        textSetting: this._generateTextAnchor(angleAxis[index].endAngle)
      }
    })
  }

  private _generateTextAnchor(angle: number) {
    const finalAngle = (angle % (Math.PI * 2) + (Math.PI * 2)) % (Math.PI * 2);
    const result: {
      anchor: string;
      baseline: string;
    } = {
      anchor: "",
      baseline: ""
    };

    if (finalAngle >= 1.9 * Math.PI && finalAngle <= 2 * Math.PI) {
      result.anchor = "middle"
      result.baseline = "baseline"
    } else if (finalAngle >= 0 && finalAngle <= 0.1 * Math.PI) {
      result.anchor = "middle"
      result.baseline = "baseline"
    } else if (finalAngle >= 0.1 * Math.PI && finalAngle <= 0.5 * Math.PI) {
      result.anchor = "start"
      result.baseline = "baseline"
    } else if (finalAngle >= 0.5 * Math.PI && finalAngle <= 0.9 * Math.PI) {
      result.anchor = "start"
      result.baseline = "hanging"
    } else if (finalAngle >= 0.9 * Math.PI && finalAngle <= Math.PI) {
      result.anchor = "middle"
      result.baseline = "hanging"
    } else if (finalAngle >= Math.PI && finalAngle <= 1.1 * Math.PI) {
      result.anchor = "middle"
      result.baseline = "hanging"
    } else if (finalAngle >= 1.1 * Math.PI && finalAngle <= 1.5 * Math.PI) {
      result.anchor = "end"
      result.baseline = "hanging"
    } else if (finalAngle >= 1.5 * Math.PI && finalAngle <= 1.9 * Math.PI) {
      result.anchor = "end"
      result.baseline = "baseline"
    }
    return result
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
      .each(function (p, j) {
        // TODO
        // console.log(this)
        // console.log(p)
        // console.log(j)
      })
  }

  private _initBar(config: Config) {
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
      .join(
        enter => enter
          .append("path")
          .attr("d", (data: string, index) => {
            return d3.arc()({
              startAngle: config.angleAxis!.startAngle!,
              endAngle: linearScale(config.data.dataset[index])!,
              outerRadius: this._getRadius(config) - bandScale(data)!,
              innerRadius: this._getRadius(config) - bandScale(data)! - bandScale.bandwidth()
            })
          })
          .attr("fill", `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`)
          .attr("fill-opacity", 0.9)
          .attr("data-index", (data: string, index) => index)
          .attr("data-category", (data: string, index) => data)
          .attr("data-value", (data: string, index) => config.data.dataset[index])
          .on("click", (e: PointerEvent) => {
            if (!config.data.click) return;
            const clickEvent: ClickDataEvent = {
              event: e,
              index: Number((e.target as HTMLElement).dataset.index),
              category: (e.target as HTMLElement).dataset.category!,
              value: Number((e.target as HTMLElement).dataset.value),
            }
            config.data.click(clickEvent)
          }),
        update => update
          .attr("d", (data: string, index) => {
            return d3.arc()({
              startAngle: config.angleAxis!.startAngle!,
              endAngle: linearScale(config.data.dataset[index])!,
              outerRadius: this._getRadius(config) - bandScale(data)!,
              innerRadius: this._getRadius(config) - bandScale(data)! - bandScale.bandwidth()
            })
          })
          .attr("data-value", (data: string, index) => config.data.dataset[index]),
        exit => exit.remove()
      )
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