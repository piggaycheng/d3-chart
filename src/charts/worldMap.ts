import * as d3 from "d3"

type Config = WorldMapType.Config

class WorldMap {
  private _svgSelection: d3.Selection<any, unknown, null, undefined>;
  private _projection: d3.GeoProjection;
  private _path: d3.GeoPath<any, d3.GeoPermissibleObjects>;
  private _mapSelection: d3.Selection<d3.BaseType, unknown, null, undefined>;

  constructor(el: string | d3.BaseType, config: Config) {
    this._svgSelection = d3.select(el as any)
      .attr("width", config.width!)
      .attr("height", config.height!)

    this._initWorldMap(config)
  }

  private async _initWorldMap(config: Config) {
    let projection = this._projection;
    if (!projection) {
      projection = d3.geoOrthographic()
        .center([0, 0])
        .scale(250)
        .clipAngle(90)
        .translate([config.width! / 2, config.height! / 2])
        .rotate([0, 0]);
      this._projection = projection;
    }

    let path = this._path;
    if (!path) {
      path = d3.geoPath()
        .projection(projection);
      this._path = path;
    }

    let mapSelection = this._svgSelection.select("g");
    if (mapSelection.empty()) {
      mapSelection = this._svgSelection.append("g");
      this._mapSelection = mapSelection;
    }

    const angle = 360
    const geoData: any = await d3.json("/static/custom.geo.json");
    mapSelection
      .selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("fill", "grey")
      .attr("name-en", (data: any) => data.properties.name_en)
      .attr("name-zht", (data: any) => data.properties.name_zht)
      .style("stroke", "#ffff")
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attrTween("d", (data: d3.GeoGeometryObjects) => {
        const interpolate = d3.interpolateRound(0, angle)
        return (t) => {
          projection.rotate([interpolate(t), 0])
          return path(data)!
        }
      })
  }
}

export default WorldMap