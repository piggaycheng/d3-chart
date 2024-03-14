import * as d3 from "d3"
import * as _ from "lodash-es"
import { flatten, unflatten } from 'flat'
import { usePolarTransition } from "../hooks/useTransition"
import useAngle from "../hooks/useAngle"
import useProxy from "../hooks/useProxy"
import type { Target } from "../hooks/useProxy"
import useConfig from "../hooks/useConfig"

type Config = PolarType.Config
type ClickLabelEvent = PolarType.ClickLabelEvent
type ClickDataEvent = PolarType.ClickDataEvent

const { d3Sin, d3Cos } = useAngle()

class Polar {
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
        distance: 15,
        length: 5
      },
      dash: 5
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
  private _lastConfig?: Config;

  private _svgSelection: d3.Selection<any, unknown, null, undefined>;
  private _barSelection: d3.Selection<SVGGElement, unknown, null, undefined>;
  private _barTextSelection: d3.Selection<SVGGElement, unknown, null, undefined>;
  private _angleAxisSelection: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(el: string | d3.BaseType, config?: Config) {
    const finalConfig = config ? useConfig().mergeConfig<Config>(this._defaultConfig, config) : this._defaultConfig;
    this._finalConfig = useProxy().createProxy<Config>(finalConfig, this._configUpdated, undefined, this);

    this._svgSelection = d3.select(el as any)
      .attr("width", this._finalConfig!.width!)
      .attr("height", this._finalConfig!.height!)

    this._initAngleAxis(this._finalConfig);
    this._initRadiusAxis(this._finalConfig);
    this._initBar(this._finalConfig);
  }

  private _initAngleAxis(config: Config) {
    const radius = this._getRadius(config);
    const angleAxis = this._getAngleAxis(config);
    const angleAxisLine = angleAxis.reduce((acc, cur) => {
      acc.push({
        startX: 0,
        startY: 0,
        endX: radius * d3Cos(cur.endAngle),
        endY: -1 * radius * d3Sin(cur.endAngle)
      })
      return acc
    }, [{
      startX: 0,
      startY: 0,
      endX: radius * d3Cos(angleAxis[0].startAngle),
      endY: -1 * radius * d3Sin(angleAxis[0].startAngle)
    }])

    let angleAxisSelection = this._angleAxisSelection;
    if (!angleAxisSelection) {
      angleAxisSelection = this._svgSelection
        .append("g")
        .attr("transform", `translate(${this._getCenter()[0]}, ${this._getCenter()[1]})`);
      this._angleAxisSelection = angleAxisSelection;
    }

    if (angleAxisSelection.select("path").empty()) angleAxisSelection.append("path")
    angleAxisSelection.select("path")
      .attr("d", d3.arc()({
        innerRadius: 0,
        outerRadius: radius,
        startAngle: config.angleAxis!.startAngle!,
        endAngle: config.angleAxis!.endAngle!
      }))
      .attr("fill", "none")
      .attr("stroke", "black")

    angleAxisSelection
      .selectAll("line.axis")
      .data(angleAxisLine)
      .join("line")
      .attr("class", "axis")
      .attr("x1", (data) => data.startX)
      .attr("y1", (data) => data.startY)
      .attr("x2", (data) => data.endX)
      .attr("y2", (data) => data.endY)
      .attr("stroke", "#000")
      .attr("stroke-dasharray", config.angleAxis!.dash!)

    const ticks = this._getTicks(config);
    angleAxisSelection
      .attr("transform", `translate(${this._getCenter()[0]}, ${this._getCenter()[1]})`)
      .selectAll("text")
      .data(ticks)
      .join("text")
      .text((tick) => tick.text.value)
      .attr("x", (tick) => tick.text.x)
      .attr("y", (tick) => tick.text.y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");

    angleAxisSelection
      .selectAll("line.tick")
      .data(ticks)
      .join("line")
      .attr("class", "tick")
      .attr("x1", (tick) => tick.tick.startX)
      .attr("y1", (tick) => tick.tick.startY)
      .attr("x2", (tick) => tick.tick.endX)
      .attr("y2", (tick) => tick.tick.endY)
      .attr("stroke", "#000")
  }

  private _getAngleAxis(config: Config) {
    const pie = d3.pie()
      .startAngle(config.angleAxis!.startAngle!)
      .endAngle(config.angleAxis!.endAngle!)
      .sort((a, b) => d3.ascending((a as any).index, (b as any).index));
    return pie(config.angleAxis!.scaleWeight!) as d3.PieArcDatum<number>[]
  }

  private _getTicks(config: Config) {
    const radius = this._getRadius(config);
    const finalRadius = this._getRadius(config) + config.angleAxis!.tick!.distance!;
    const angleAxis = this._getAngleAxis(config);
    const tickLength = config.angleAxis!.tick!.length!;

    const ticks = d3.scaleLinear().domain([config.angleAxis!.minValue!, config.angleAxis!.maxValue!]).ticks(config.angleAxis!.scaleWeight!.length);
    const result = angleAxis.reduce((acc, cur, index) => {
      acc.push({
        text: {
          value: ticks[index + 1],
          x: finalRadius * d3Cos(cur.endAngle),
          y: -1 * finalRadius * d3Sin(cur.endAngle)
        },
        tick: {
          startX: radius * d3Cos(cur.endAngle),
          startY: -1 * radius * d3Sin(cur.endAngle),
          endX: (radius + tickLength) * d3Cos(cur.endAngle),
          endY: -1 * (radius + tickLength) * d3Sin(cur.endAngle),
        }
      });
      return acc
    }, [{
      text: {
        value: ticks[0],
        x: finalRadius * d3Cos(config.angleAxis!.startAngle!),
        y: -1 * finalRadius * d3Sin(config.angleAxis!.startAngle!)
      },
      tick: {
        startX: radius * d3Cos(config.angleAxis!.startAngle!),
        startY: -1 * radius * d3Sin(config.angleAxis!.startAngle!),
        endX: (radius + tickLength) * d3Cos(config.angleAxis!.startAngle!),
        endY: -1 * (radius + tickLength) * d3Sin(config.angleAxis!.startAngle!),
      }
    }])

    return result
  }

  private _initRadiusAxis(config: Config) {
    const bandScale = this._getRadiusAxisBandScale(config);

    this._svgSelection
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

  private _getRadiusAxisBandScale(config: Config) {
    const bandScale = d3.scaleBand()
      .range([0, this._getRadius(config)])
      .domain(config.radiusAxis!.categories!)
      .padding(config.radiusAxis!.padding!);
    if (config.radiusAxis?.innerPadding) bandScale.paddingInner(config.radiusAxis?.innerPadding);
    if (config.radiusAxis?.outerPadding) bandScale.paddingOuter(config.radiusAxis?.outerPadding);
    return bandScale
  }

  private _initBar(config: Config) {
    const dataTransitionHook = usePolarTransition(config, this._getAngleAxis(config), this._getRadius(config), this._getCenter(), this._lastConfig);
    const tweens = dataTransitionHook.generateBarTween()

    let bars = this._barSelection;
    if (!bars) {
      bars = this._svgSelection
        .append("g")
        .attr("transform", `translate(${this._getCenter()[0]}, ${this._getCenter()[1]})`);
      this._barSelection = bars;
    }

    bars
      .selectAll("path")
      .data(config.data.dataset)
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
      .attr("data-index", (data, index) => index)
      .attr("data-category", (data, index) => data)
      .attr("data-value", (data, index) => config.data.dataset[index])
      .style("cursor", "pointer")
      .transition()
      .duration(1000)
      .attrTween("d", (data, index) => tweens[index])

    this._initBarText(this._finalConfig);
  }

  private _initBarText(config: Config) {
    const dataTransitionHook = usePolarTransition(config, this._getAngleAxis(config), this._getRadius(config), this._getCenter(), this._lastConfig);
    const tweenSet = dataTransitionHook.generateBarTextTween()

    let barText = this._barTextSelection;
    if (!barText) {
      barText = this._svgSelection
        .append("g")
        .attr("transform", `translate(${this._getCenter()[0]}, ${this._getCenter()[1]})`)
      this._barTextSelection = barText;
    }

    barText
      .selectAll("text")
      .data(config.data.dataset)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .transition()
      .duration(1000)
      .attrTween("x", (data, index) => tweenSet.xTweens![index])
      .attrTween("y", (data, index) => tweenSet.yTweens![index])
      .textTween((data, index) => tweenSet.textTween![index])
  }

  private _getCenter() {
    return [this._svgSelection.node().clientWidth / 2, this._svgSelection.node().clientHeight / 2]
  }

  private _getRadius(config: Config) {
    const padding = config.padding!
    return Math.min(this._svgSelection.node().clientWidth / 2, this._svgSelection.node().clientHeight / 2) - padding
  }

  _configUpdated(target: Target, prop: string, value: any, receiver: any, parentProp?: string) {
    const fullProp = parentProp ? `${parentProp}.${prop}` : prop;
    switch (fullProp) {
      case "data.dataset":
        this._initBar(this._finalConfig);
        break
      case "angleAxis.startAngle":
      case "angleAxis.endAngle":
      case "angleAxis.scaleWeight":
        this._initAngleAxis(this._finalConfig);
        this._initBar(this._finalConfig);
        break
      case "angleAxis.tick.distance":
        this._initAngleAxis(this._finalConfig);
        break
    }
  }

  update(key: string, value: any) {
    this._lastConfig = _.cloneDeep(this._finalConfig);
    const temp: Record<string, any> = {}
    temp[key] = value;
    useConfig().mergeConfig<Config>(this._finalConfig, unflatten(temp))
  }
}

export default Polar