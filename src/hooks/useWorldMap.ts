import * as d3 from "d3"
import * as topojson from "topojson-client"
import { Topology, GeometryObject } from "topojson-specification"
import * as GeoJSON from "geojson";

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
  async function initGeoData() {
    const geoJson = await d3.json("/static/countries-110m.json") as Topology;
    const countries = (topojson.feature(geoJson, geoJson.objects.countries) as GeoJSON.FeatureCollection).features
    const borders = topojson.mesh(geoJson, geoJson.objects.countries as GeometryObject, (a, b) => a !== b)
    const land = topojson.feature(geoJson, geoJson.objects.land)

    return {
      countries,
      borders,
      land
    }
  }

  function renderSphere(d3SvgEl: d3.Selection<SVGGElement, unknown, null, undefined>, geoPath: d3.GeoPath) {
    d3SvgEl
      .append("path")
      .attr("d", geoPath({ type: "Sphere" }))
      .attr("fill", "none")
      .attr("stroke", "black")
  }

  function renderCountries(d3SvgEl: d3.Selection<SVGGElement, unknown, null, undefined>, geoPath: d3.GeoPath, countries: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]) {
    d3SvgEl.select(".countries")
      .selectAll("path")
      .data(countries)
      .join("path")
      .attr("d", geoPath)
      .attr("fill", "#ccc")
      .attr("data-id", d => d.id ?? null)
  }

  function renderLinePath(d3SvgEl: d3.Selection<SVGGElement, unknown, null, undefined>, geoPath: d3.GeoPath, srcCountry: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>, destCountry: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>) {
    const p1 = d3.geoCentroid(srcCountry);
    const p2 = d3.geoCentroid(destCountry);
    const ip = d3.geoInterpolate(p1, p2)

    d3SvgEl.select(".linePath")
      .append("path")
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
      .attr("stroke", "black")
      .transition()
      .duration(1250)
      .attrTween("d", () => t => {
        return geoPath({ type: "LineString", coordinates: [p1, ip(t)] }) ?? ""
      })
      .transition()
      .duration(1250)
      .attrTween("d", () => t => {
        return geoPath({ type: "LineString", coordinates: [ip(t), p2] }) ?? ""
      })
      .on("end", function () {
        d3.select(this).remove()
      })
  }

  return {
    initGeoData,
    renderSphere,
    renderCountries,
    renderLinePath
  }
}