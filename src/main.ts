import { Polar } from "./index"

const container = document.createElement("div")
const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
container.append(svgEl)
document.querySelector("body")!.append(container);
const polar = new Polar("svg", {
  type: "polar",
  width: 500,
  height: 500,
  angleAxis: {
    startAngle: Math.PI * 1.5,
    endAngle: Math.PI * 2,
    scaleWeight: [2, 2, 2, 2, 2, 1, 1, 1, 1, 1],
    tick: {
      distance: 15
    }
  },
  radiusAxis: {
    click: (e) => {
      console.log(e)
    },
    categories: ["A", "B", "C"]
  },
  data: {
    dataset: [20, 40, 60],
  }
});

setTimeout(() => {
  polar.update([100, 50, 100])
}, 3000);