declare namespace WorldMapType {
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
      countries: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[];
      borders: GeoJSON.MultiLineString;
      land: GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> | GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;
    }>;

    renderSphere: (d3SvgEl: d3.Selection<SVGGElement, unknown, null, undefined>, geoPath: d3.GeoPath) => void;
    renderCountries: (d3SvgEl: d3.Selection<SVGGElement, unknown, null, undefined>, geoPath: d3.GeoPath, countries: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]) => void;
    renderLinePath: (d3SvgEl: d3.Selection<SVGGElement, unknown, null, undefined>, geoPath: d3.GeoPath, srcCountry: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>, destCountry: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>) => void;
  }
}