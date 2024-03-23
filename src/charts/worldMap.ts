import * as d3 from "d3"
import * as _ from "lodash-es"
import { unflatten } from 'flat'
import useProxy from "../hooks/useProxy"
import type { Target } from "../hooks/useProxy"
import useConfig from "../hooks/useConfig"
import useWorldMap from "../hooks/useWorldMap"

type Config = WorldMapType.Config

class WorldMap {
  private _svgSelection: d3.Selection<any, unknown, null, undefined>;
  private _projection: d3.GeoProjection;
  private _geoPath: d3.GeoPath<any, d3.GeoPermissibleObjects>;
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
  private _worldMapHook: WorldMapType.WorldMapHook;
  private _countries: WorldMapType.Countries;

  constructor(el: string | d3.BaseType, config: Config) {
    const finalConfig = config ? useConfig().mergeConfig<Config>(this._defaultConfig, config) : this._defaultConfig;
    this._finalConfig = useProxy().createProxy<Config>(finalConfig, this._configUpdated, undefined, this);

    this._worldMapHook = useWorldMap();

    this._svgSelection = d3.select(el as any)
      .attr("width", config.width!)
      .attr("height", config.height!)
    this._svgSelection
      .append("g").attr("class", "countries")
    this._svgSelection
      .append("g").attr("class", "linePath")

    this._initWorldMap(config)
  }

  private async _initWorldMap(config: Config) {
    const { countries, borders, land } = await this._worldMapHook.initGeoData();
    this._countries = countries;

    const projection = d3.geoAzimuthalEqualArea().fitExtent([[0, 0], [config.width!, config.width!]], { type: "Sphere" });
    this._projection = projection;
    this._geoPath = d3.geoPath(projection);

    this._renderWorldMap();
  }

  private _renderWorldMap() {
    this._worldMapHook.renderSphere(this._svgSelection, this._geoPath);
    this._worldMapHook.renderCountries(this._svgSelection, this._geoPath, this._countries);
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

  rotate(angle: number) {
    this._projection.rotate([angle, 0, 0])
    this._renderWorldMap()
  }

  renderLinePath(src: string, dest: string) {
    let srcCountry = null;
    let destCountry = null;
    for (let i = 0; i < this._countries.length; i++) {
      if (this._countries[i].properties?.name === src) {
        srcCountry = this._countries[i];
      }
      if (this._countries[i].properties?.name === dest) {
        destCountry = this._countries[i];
      }
    }

    if (srcCountry && destCountry)
      this._worldMapHook.renderLinePath(this._svgSelection, this._geoPath, srcCountry, destCountry)
  }
}

export default WorldMap