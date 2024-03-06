declare namespace PolarTypes {
  type Config = {
    width?: string | number;
    height?: string | number;
    padding?: number;
    angleAxis?: AngleAxis;
    radiusAxis?: RadiusAxis;
    data: Data;
  }

  type AngleAxis = {
    startAngle?: number;
    endAngle?: number;
    scaleWeight?: number[];
    maxValue?: number;
    minValue?: number;
    tick?: Tick;
  }

  type Tick = {
    distance?: number;
  }

  type RadiusAxis = {
    categories: string[];
    padding?: number;
    innerPadding?: number;
    outerPadding?: number;
    click?: (e: ClickLabelEvent) => void;
  }

  type Data = {
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