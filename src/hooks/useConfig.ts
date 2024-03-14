import * as _ from "lodash-es"

type Config = Chart.Config & Record<string, any>
type ChartType = Chart.ChartType

export default function () {
  function mergeConfig(dest: Config, src: Config, type: ChartType) {
    _.mergeWith(dest, src, function (objValue, srcValue) {
      if (_.isArray(objValue)) {
        return srcValue;
      }
    });

    return dest
  }

  return {
    mergeConfig
  }
}