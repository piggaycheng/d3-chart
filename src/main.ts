import { Polar } from "./index"

const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
document.querySelector("body")!.append(svgEl);
const polar = new Polar("svg", {
  width: 500,
  height: 500,
  angleAxis: {
    startAngle: Math.PI * 1.5,
    endAngle: Math.PI * 2,
    scaleWeight: [2, 2, 2, 2, 2, 1, 1, 1, 1, 1]
  },
  data: {
    dataset: [20, 40, 60],
  }
});

setTimeout(() => {
  polar.update([100, 50, 100])
}, 3000);