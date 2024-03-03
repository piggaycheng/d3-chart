import * as d3 from "d3"

export default function (domains: number[][], ranges: number[][]) {
  const linearScales: d3.ScaleLinear<number, number, never>[] = [];
  domains.forEach((domain, index) => {
    const linearScale = d3.scaleLinear().domain(domain).range(ranges[index]);
    linearScales.push(linearScale);
  })

  function scaleLinear(value: number) {
    for (let i = 0; i < linearScales.length; i++) {
      const linearScale = linearScales[i];
      if (value >= linearScale.domain()[0] && value <= linearScale.domain()[1]) {
        return linearScale(value)
      }
    }
  }

  function scaleLinearInvert(value: number) {
    for (let i = 0; i < linearScales.length; i++) {
      const linearScale = linearScales[i];
      if (value >= linearScale.range()[0] && value <= linearScale.range()[0])
        return linearScale.invert(value)
    }
  }

  return {
    scaleLinear,
    scaleLinearInvert,
  }
}