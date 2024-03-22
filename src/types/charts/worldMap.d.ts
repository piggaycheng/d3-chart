declare namespace WorldMapType {
  type Countries = GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[];
  type Borders = GeoJSON.MultiLineString;
  type Land = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> | GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

  interface Config extends Chart.Config {
    width?: number;
    height?: number;
    map: MapConfig;
  }

  interface MapConfig {
    angle: number
  }

  interface WorldMapHook {
    initGeoData: () => Promise<{
      countries: Countries;
      borders: Borders;
      land: Land;
    }>;

    renderSphere: (d3SvgEl: d3.Selection<SVGGElement, unknown, null, undefined>, geoPath: d3.GeoPath) => void;
    renderCountries: (d3SvgEl: d3.Selection<SVGGElement, unknown, null, undefined>, geoPath: d3.GeoPath, countries: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]) => void;
    renderLinePath: (d3SvgEl: d3.Selection<SVGGElement, unknown, null, undefined>, geoPath: d3.GeoPath, srcCountry: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>, destCountry: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>) => void;
  }
}