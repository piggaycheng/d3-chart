import * as d3 from "d3"
import useAngle from "./useAngle"

const { d3Sin, d3Cos } = useAngle()

export function usePolarTransition(config: PolarType.Config, angleAxis: d3.PieArcDatum<number>[], radius: number, svgCenter: number[], lastConfig?: PolarType.Config) {
  const domain = d3.scaleLinear().domain([config.angleAxis!.minValue!, config.angleAxis!.maxValue!]).ticks(config.angleAxis!.scaleWeight!.length);
  const range = angleAxis.reduce<number[]>((acc, cur) => {
    acc.push(cur.endAngle);
    return acc
  }, [config.angleAxis!.startAngle!]);
  const linearScale = d3.scaleLinear().domain(domain).range(range);
  const bandScale = d3.scaleBand()
    .range([0, radius])
    .domain(config.radiusAxis!.categories!)
    .padding(config.radiusAxis!.padding!);
  if (config.radiusAxis?.innerPadding) bandScale.paddingInner(config.radiusAxis?.innerPadding);
  if (config.radiusAxis?.outerPadding) bandScale.paddingOuter(config.radiusAxis?.outerPadding);

  function generateBarTween() {
    const tweens = config.data.dataset.map((data, index) => {
      const startAngle = lastConfig ? linearScale(lastConfig.data.dataset[index]) : config.angleAxis!.startAngle!;
      const interpolate = d3.interpolateNumber(startAngle, linearScale(data));
      return function (t: number) {
        return d3.arc()({
          startAngle: config.angleAxis!.startAngle!,
          endAngle: interpolate(t),
          outerRadius: radius - bandScale(config.radiusAxis!.categories[index])!,
          innerRadius: radius - bandScale(config.radiusAxis!.categories[index])! - bandScale.bandwidth()
        })!
      }
    });

    return tweens
  }

  function generateBarTextTween() {
    const tweenSet: {
      xTweens?: ((t: number) => string)[];
      yTweens?: ((t: number) => string)[];
      textTween?: ((t: number) => string)[];
    } = {}
    tweenSet.xTweens = config.data.dataset.map((data, index) => {
      const middleAngle = (linearScale(data) + config.angleAxis!.startAngle!) / 2;
      const startAngle = lastConfig ? (linearScale(lastConfig.data.dataset[index]) + config.angleAxis!.startAngle!) / 2 : config.angleAxis!.startAngle!;
      const interpolate = d3.interpolateNumber(startAngle, middleAngle);
      const textRadius = radius - bandScale(config.radiusAxis!.categories![index])! - 0.5 * bandScale.bandwidth();
      return function (t: number) {
        return (textRadius * d3Cos(interpolate(t))).toString()
      }
    });
    tweenSet.yTweens = config.data.dataset.map((data, index) => {
      const middleAngle = (linearScale(data) + config.angleAxis!.startAngle!) / 2;
      const startAngle = lastConfig ? (linearScale(lastConfig.data.dataset[index]) + config.angleAxis!.startAngle!) / 2 : config.angleAxis!.startAngle!;
      const interpolate = d3.interpolateNumber(startAngle, middleAngle);
      const textRadius = radius - bandScale(config.radiusAxis!.categories![index])! - 0.5 * bandScale.bandwidth();
      return function (t: number) {
        return (-1 * textRadius * d3Sin(interpolate(t))).toString()
      }
    });
    tweenSet.textTween = config.data.dataset.map((data, index) => {
      const startValue = lastConfig ? lastConfig.data.dataset[index] : config.angleAxis!.minValue!;
      const interpolate = d3.interpolateRound(startValue, data)
      return function (t: number) {
        return interpolate(t).toString()
      }
    })

    return tweenSet
  }

  return {
    generateBarTween,
    generateBarTextTween
  }
}