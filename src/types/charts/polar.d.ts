declare namespace PolarType {
  interface Config extends Chart.Config {
    width?: string | number;
    height?: string | number;
    padding?: number;
    angleAxis?: AngleAxis;
    radiusAxis?: RadiusAxis;
    data: Data;
  }

  interface AngleAxis {
    startAngle?: number;
    endAngle?: number;
    scaleWeight?: number[];
    maxValue?: number;
    minValue?: number;
    tick?: Tick;
    dash?: number;
  }

  interface Tick {
    distance?: number;
    length?: number;
  }

  interface RadiusAxis {
    categories: string[];
    padding?: number;
    innerPadding?: number;
    outerPadding?: number;
    click?: (e: ClickLabelEvent) => void;
  }

  interface Data {
    dataset: number[];
    click?: (e: ClickDataEvent) => void;
  }

  interface ClickEvent {
    event: PointerEvent;
  }

  interface ClickDataEvent extends ClickEvent {
    index: number;
    value: number | string;
    category: string;
  }

  interface ClickLabelEvent extends ClickEvent {
    index: number;
    value: number | string;
    category: string;
  }
}