import * as d3 from "d3"

export class Versor {
  static fromAngles([l, p, g]: number[]) {
    l *= Math.PI / 360;
    p *= Math.PI / 360;
    g *= Math.PI / 360;
    const sl = Math.sin(l), cl = Math.cos(l);
    const sp = Math.sin(p), cp = Math.cos(p);
    const sg = Math.sin(g), cg = Math.cos(g);
    return [
      cl * cp * cg + sl * sp * sg,
      sl * cp * cg - cl * sp * sg,
      cl * sp * cg + sl * cp * sg,
      cl * cp * sg - sl * sp * cg
    ];
  }
  static toAngles([a, b, c, d]: number[]) {
    return [
      Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * 180 / Math.PI,
      Math.asin(Math.max(-1, Math.min(1, 2 * (a * c - d * b)))) * 180 / Math.PI,
      Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * 180 / Math.PI
    ];
  }
  static interpolateAngles(a: number[], b: number[]) {
    const i = Versor.interpolate(Versor.fromAngles(a), Versor.fromAngles(b));
    return (t: number) => Versor.toAngles(i(t));
  }
  static interpolateLinear([a1, b1, c1, d1]: number[], [a2, b2, c2, d2]: number[]) {
    a2 -= a1, b2 -= b1, c2 -= c1, d2 -= d1;
    const x = new Array(4);
    return (t: number) => {
      const l = Math.hypot(x[0] = a1 + a2 * t, x[1] = b1 + b2 * t, x[2] = c1 + c2 * t, x[3] = d1 + d2 * t);
      x[0] /= l, x[1] /= l, x[2] /= l, x[3] /= l;
      return x;
    };
  }
  static interpolate([a1, b1, c1, d1]: number[], [a2, b2, c2, d2]: number[]) {
    let dot = a1 * a2 + b1 * b2 + c1 * c2 + d1 * d2;
    if (dot < 0) a2 = -a2, b2 = -b2, c2 = -c2, d2 = -d2, dot = -dot;
    if (dot > 0.9995) return Versor.interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]);
    const theta0 = Math.acos(Math.max(-1, Math.min(1, dot)));
    const x = new Array(4);
    const l = Math.hypot(a2 -= a1 * dot, b2 -= b1 * dot, c2 -= c1 * dot, d2 -= d1 * dot);
    a2 /= l, b2 /= l, c2 /= l, d2 /= l;
    return (t: number) => {
      const theta = theta0 * t;
      const s = Math.sin(theta);
      const c = Math.cos(theta);
      x[0] = a1 * c + a2 * s;
      x[1] = b1 * c + b2 * s;
      x[2] = c1 * c + c2 * s;
      x[3] = d1 * c + d2 * s;
      return x;
    };
  }
}

export default function () {
  async function* renderCanvas(width: number, height: number, tilt: number, land: d3.GeoPermissibleObjects, borders: d3.GeoPermissibleObjects, countries: any) {
    const canvas = d3.create("canvas")
      .attr("width", width)
      .attr("height", height)
    const context = canvas.node()?.getContext("2d")!;
    const projection = d3.geoOrthographic().fitExtent([[0, 0], [width, height]], { type: "Sphere" });
    const path = d3.geoPath(projection, context);

    function render(country: d3.GeoPermissibleObjects, arc?: d3.GeoPermissibleObjects) {
      context.clearRect(0, 0, width, height);
      context.beginPath(), path(land), context.fillStyle = "#ccc", context.fill();
      context.beginPath(), path(country), context.fillStyle = "#f00", context.fill();
      context.beginPath(), path(borders), context.strokeStyle = "#fff", context.lineWidth = 0.5, context.stroke();
      context.beginPath(), path({ type: "Sphere" }), context.strokeStyle = "#000", context.lineWidth = 1.5, context.stroke();
      context.beginPath();
      if (arc) path(arc)
      context.stroke();
      return context.canvas;
    }

    let p1: [number, number], p2: [number, number] = [0, 0], r1, r2 = [0, 0, 0];
    for (const country of countries) {
      yield render(country);

      p1 = p2, p2 = d3.geoCentroid(country);
      r1 = r2, r2 = [-p2[0], tilt - p2[1], 0];
      const ip = d3.geoInterpolate(p1, p2);
      const iv = Versor.interpolateAngles(r1, r2);

      await d3.transition()
        .duration(1250)
        .tween("render", () => t => {
          projection.rotate(iv(t) as [number, number, number]);
          render(country, { type: "LineString", coordinates: [p1, ip(t)] });
        })
        .transition()
        .tween("render", () => t => {
          render(country, { type: "LineString", coordinates: [ip(t), p2] });
        })
        .end();
    }
  }

  return {
    renderCanvas
  }
}