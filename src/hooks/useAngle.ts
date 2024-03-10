export default function () {
  const OFFSET_ANGLE = 0.5 * Math.PI;

  function d3Sin(angle: number) {
    return Math.sin(angle + OFFSET_ANGLE)
  }

  function d3Cos(angle: number) {
    return Math.cos(angle - OFFSET_ANGLE)
  }

  return {
    d3Sin,
    d3Cos
  }
}