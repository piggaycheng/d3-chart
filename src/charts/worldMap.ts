import * as d3 from "d3"
import * as _ from "lodash-es"
import { unflatten } from 'flat'
import useProxy from "../hooks/useProxy"
import type { Target } from "../hooks/useProxy"
import useConfig from "../hooks/useConfig"

type Config = WorldMapType.Config

class WorldMap {
  private _svgSelection: d3.Selection<any, unknown, null, undefined>;
  private _projection: d3.GeoProjection;
  private _path: d3.GeoPath<any, d3.GeoPermissibleObjects>;
  private _mapSelection: d3.Selection<d3.BaseType, unknown, null, undefined>;
  private _defaultConfig: Config = {
    type: "worldMap",
    width: 500,
    height: 500,
    map: {
      angle: 0
    }
  };
  private _finalConfig: Config;
  private _lastConfig?: Config;

  constructor(el: string | d3.BaseType, config: Config) {
    const finalConfig = config ? useConfig().mergeConfig<Config>(this._defaultConfig, config) : this._defaultConfig;
    this._finalConfig = useProxy().createProxy<Config>(finalConfig, this._configUpdated, undefined, this);

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

    let mapSelection = this._mapSelection;
    if (!mapSelection) {
      mapSelection = this._svgSelection.append("g");
      this._mapSelection = mapSelection;
    }
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
      .ease(d3.easeLinear)
      .attrTween("d", (data: d3.GeoGeometryObjects) => {
        const lastConfig = this._lastConfig ?? this._finalConfig;
        const interpolate = d3.interpolateRound(lastConfig.map.angle, this._finalConfig.map.angle);
        return (t) => {
          projection.rotate([interpolate(t), 0])
          return path(data) ?? ""
        }
      })
  }

  private _configUpdated(target: Target, prop: string, value: any, receiver: any, parentProp?: string) {
    const fullProp = parentProp ? `${parentProp}.${prop}` : prop;
    switch (fullProp) {
      case "map.angle":
        this._initWorldMap(this._finalConfig)
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

export default WorldMap