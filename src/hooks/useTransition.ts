import * as d3 from "d3"

export function useDataTransition() {

  function generatePolarTween(config: PolarType.Config, angleAxis: d3.PieArcDatum<number>[], radius: number, lastConfig?: PolarType.Config) {
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

  return {
    generatePolarTween
  }
}