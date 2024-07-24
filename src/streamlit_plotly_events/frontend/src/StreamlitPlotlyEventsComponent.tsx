import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib";
import React, { ReactNode } from "react";
import Plot from 'react-plotly.js';

interface MyState {
  data: any[];
  layout: any;
  clickedPoints: { x: number; y: number; z: number };
  measureMode: boolean;
  measurePoints: any[];
  measureLineWidth: number;
  camera?: number[]
  deferInitialLayoutReturn?: boolean
}

interface cameraPostionObject {
  cameraLayout: {
    x: number
    y: number
    z: number
  }
}

class StreamlitPlotlyEventsComponent extends StreamlitComponentBase<MyState> {
  // Create state for points
  state: MyState = {
    data: [],
    layout: {},
    clickedPoints: { x: 0.0, y: 0.0, z: 0.0 },
    measureMode: false,
    measurePoints: [],
    measureLineWidth: 0.0
  };
  private isProcessing: boolean = false;
  private processingTimeout: NodeJS.Timeout | null = null;

  // init the component state when first starting it
  // make the layout constant across updates
  componentDidMount() {
    let plot_obj = JSON.parse(this.props.args["plot_obj"])
    let measure_mode: boolean = this.props.args['measure_mode']
    let measure_line_width: number = this.props.args['measure_line_width']

    plot_obj.layout.uirevision = 'true'
    console.log('current plot layout: ', plot_obj.layout)
    this.setState({
      data: plot_obj.data,
      layout: plot_obj.layout,
      clickedPoints: {
        x: 0,
        y: 0,
        z: 0,
      },
      measureMode: measure_mode,
      measurePoints: [],
      measureLineWidth: measure_line_width,
      deferInitialLayoutReturn: true
    });
  }

  public render = (): ReactNode => {
    // Pull Plotly object from args and parse
    var plot_obj = JSON.parse(this.props.args["plot_obj"]);
    const override_height = this.props.args["override_height"];
    const override_width = this.props.args["override_width"];
    const plotClickedPoint: boolean = this.props.args['plot_clicked_point']
    // const measureLineWidth: number = this.props.args['measure_line_width']
    /*Get the current point size of the chart we are plotting to draw the extra clicked point
      with respect to the scale of the plotted points
    */
    const clickedPointSize: number = this.props.args['clicked_point_size']
    // Event booleans
    const click_event = this.props.args["click_event"];
    const select_event = this.props.args["select_event"];
    const hover_event = this.props.args["hover_event"];
    const with_z = this.props.args["with_z"];
    const get_relayout = this.props.args['get_relayout']

    Streamlit.setFrameHeight(override_height);
    return (
      <Plot
        data={this.state.data}
        layout={this.state.layout}
        // config={this.state.config}
        // frames={this.state.frames}
        onClick={click_event ? this.plotlyEventHandler(with_z, plot_obj, plotClickedPoint, clickedPointSize) : undefined}
        onSelected={select_event ? this.plotlyEventHandler(with_z) : undefined}
        onHover={hover_event ? this.plotlyEventHandler(with_z) : undefined}
        onRelayout={get_relayout ? this.relayoutEventHandler : undefined}
        style={{ width: override_width, height: override_height }}
        className="stPlotlyChart"
      />
    );
  };

  /** Click handler for plot. */
  private plotlyEventHandler = (with_z: boolean, plot_obj?: any, plot_clicked_point?: boolean, clicked_point_size?: number) => {

    // console.log('pressed on point')
    return (data: any) => {
   
      // console.log('pressed on point', JSON.stringify(data.points[0], getCircularReplacer(), 2))
      // console.log('current plot object', plot_obj)
      let currentClickedPoint = data.points[0]
      let previousClickedPointState = this.state.clickedPoints
      let needToUpdate = false
      if (currentClickedPoint.x !== previousClickedPointState.x ||
        currentClickedPoint.y !== previousClickedPointState.y ||
        currentClickedPoint.z !== previousClickedPointState.z) {
        console.log('clicked point x diff')
        needToUpdate = true
        this.setState({
          clickedPoints: {
            x: currentClickedPoint.x,
            y: currentClickedPoint.y,
            z: currentClickedPoint.z,
          }
        })
      } else {
        needToUpdate = false
      }

      // measurePlot is used within the lifetime of this function
      let measurePlot: any = {}
      if (plot_clicked_point && needToUpdate === true) {

        const getPoint = data.points[0]
        // const traceIndex = getPoint.curveNumber
        // const pointIndex = getPoint.pointNumber
        console.log(`current getPoint:`, getPoint)
        // console.log('current point number:', pointIndex)
        // console.log('current trace number', traceIndex)
        // console.log('current colors: ', plot_obj.data[traceIndex].marker.color[pointIndex])
        // console.log('current data for plot', this.state.data)

        // console.log('plot_obj', plot_obj)
        // create a point object to add to our current plot to indicate the clicked point
        interface newPoint {
          x: number[];
          y: number[];
          z?: number[];
          mode: string;
          marker: {
            color: string;
            size?: number;
          };
          showlegend: boolean;
          type: string;
          name: string,
          text: string[],
          hovertemplate: string,
        }

        let clickPointPlot: newPoint = {
          x: [getPoint.x],
          y: [getPoint.y],
          z: [getPoint.z],
          mode: 'markers',
          marker: {
            color: 'red',
            // size: clicked_point_size === 0.0 && undefined? 5.0: clicked_point_size*1.5,
          },
          showlegend: false,
          type: getPoint.z !== undefined ? 'scatter3d' : 'scatter',
          name: 'Clicked Point',
          text: ['Clicked Point'],
          hovertemplate: '<b>%{text}</b><br>'
            + `<b>x: ${getPoint.x.toFixed(3)}</b><br>`
            + `<b>y: ${getPoint.y.toFixed(3)}</b><br>`
            + `<b>z: ${getPoint.z.toFixed(3)}</b><extra></extra>`

        };

        if (clicked_point_size !== undefined) {
          clickPointPlot.marker.size = clicked_point_size
        }
        else {
          clickPointPlot.marker.size = 5.0
        }


        // calculate measure points and plot them on the chart
        if (this.state.measureMode === true) {
          // let measurePoints = this.state.measurePoints
          // measurePoints.push(clickPointPlot)
          if (this.state.measurePoints.length >= 2) {
            this.state.measurePoints.length = 0;
            this.state.measurePoints.push(clickPointPlot)
          }
          else {
            this.state.measurePoints.push(clickPointPlot)
          }
          // calculate measure points when the length is 2 then plot on the chart
          if (this.state.measurePoints.length === 2) {
            const measurePoints = this.state.measurePoints

            measurePlot = this.createMeasureLine(measurePoints)
            measurePoints.push(...measurePlot.lines)
          }

          console.log('measure points: ', this.state.measurePoints)
        }
        // update the plot 
        // append new trace of clicked point here then update plot state
        if (this.state.measureMode === true) {
          plot_obj.data.push(...this.state.measurePoints)
        }
        else {
          plot_obj.data.push(clickPointPlot)
        }
        // console.log('plotting using: ', plot_obj)
        this.updatePlotState(plot_obj)
      }

      // Build array of points to return
      if (needToUpdate === true) {
        let clickedPoints: Array<any> = [];
        data.points.forEach(function (arrayItem: any) {
          if (with_z) {
            clickedPoints.push({
              x: arrayItem.x,
              y: arrayItem.y,
              z: arrayItem.z,
              curveNumber: arrayItem.curveNumber,
              pointNumber: arrayItem.pointNumber,
              pointIndex: arrayItem.pointIndex
            });
          } else {
            clickedPoints.push({
              x: arrayItem.x,
              y: arrayItem.y,
              curveNumber: arrayItem.curveNumber,
              pointNumber: arrayItem.pointNumber,
              pointIndex: arrayItem.pointIndex
            });
          }
        });

        // Add measure points to return when in measure mode
        if (this.state.measureMode === true) {
          console.log('measurepoint length: ', this.state.measurePoints.length)
          clickedPoints.push({
            // x: this.state.measurePoints.map(pointX => pointX.x)
            measurePointsX: this.state.measurePoints.map(points => points.x).filter(measurePointsX => measurePointsX.length === 1).flat(),
            measurePointsY: this.state.measurePoints.map(points => points.y).filter(measurePointsY => measurePointsY.length === 1).flat(),
            measurePointsZ: this.state.measurePoints.map(points => points.z).filter(measurePointsZ => measurePointsZ.length === 1).flat(),
            dx: this.state.measurePoints.length === 1 ? 0 : parseFloat(measurePlot.distances[0].toFixed(3)),
            dy: this.state.measurePoints.length === 1 ? 0 : parseFloat(measurePlot.distances[1].toFixed(3)),
            dz: this.state.measurePoints.length === 1 ? 0 : parseFloat(measurePlot.distances[2].toFixed(3)),
            dxyz: this.state.measurePoints.length === 1 ? 0 : parseFloat(measurePlot.distances[3].toFixed(3)),
            dxy: this.state.measurePoints.length === 1 ? 0 : parseFloat(measurePlot.distances[4].toFixed(3)),
            dxz: this.state.measurePoints.length === 1 ? 0 : parseFloat(measurePlot.distances[5].toFixed(3)),
            dyz: this.state.measurePoints.length === 1 ? 0 : parseFloat(measurePlot.distances[6].toFixed(3)),
          })
        }

        // Return array as JSON to Streamlit
        console.log('Updating clicked point')
        this.debouncedStreamlitReturn(JSON.stringify(clickedPoints));
      }

    };
  };
  private createMeasureLine = (measurePoints: any) => {
    const dx = Math.abs(measurePoints[1].x - measurePoints[0].x)
    const dy = Math.abs(measurePoints[1].y - measurePoints[0].y)
    const dz = Math.abs(measurePoints[1].z - measurePoints[0].z)
    const dxyz = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2))

    const dxy = Math.sqrt(dx * dx + dy * dy);
    const dxz = Math.sqrt(dx * dx + dz * dz);
    const dyz = Math.sqrt(dy * dy + dz * dz);

    // xyz measure line
    const linexyz = {
      x: [...measurePoints[0].x, ...measurePoints[1].x],
      y: [...measurePoints[0].y, ...measurePoints[1].y],
      z: [...measurePoints[0].z, ...measurePoints[1].z],
      mode: 'lines',
      line: {
        color: 'purple',
        width: this.state.measureLineWidth,
      },
      type: 'scatter3d',
      name: 'Distance',
      text: ["Point 1", "Point 2"],
      hovertemplate: "<b>%{text}</b><br>"
        + `<b>Measured distance: ${dxyz.toFixed(3)}m</b><br>`
        + `<b>ΔXY: ${dxy.toFixed(3)}</b><br>`
        + `<b>ΔXZ: ${dxz.toFixed(3)}</b><br>`
        + `<b>ΔYZ: ${dyz.toFixed(3)}</b><extra></extra>`
    };

    // x measure line
    const linex = {
      x: [...measurePoints[0].x, ...measurePoints[1].x],
      y: [...measurePoints[0].y, ...measurePoints[0].y],
      z: [...measurePoints[0].z, ...measurePoints[0].z],
      mode: 'lines',
      line: {
        color: 'red',
        width: this.state.measureLineWidth,
      },
      type: 'scatter3d',
      name: 'Distance X',
      text: ["Point 1", "Point 2"],
      hovertemplate: `<b>Measured distance X: ${dx.toFixed(3)}m</b><extra></extra>`
    };

    // xz measure line
    const liney = {
      x: [...measurePoints[1].x, ...measurePoints[1].x],
      y: [...measurePoints[0].y, ...measurePoints[1].y],
      z: [...measurePoints[0].z, ...measurePoints[0].z],
      mode: 'lines',
      line: {
        color: 'green',
        width: this.state.measureLineWidth,
      },
      type: 'scatter3d',
      name: 'Distance Y',
      text: ["Point 1", "Point 2"],
      hovertemplate: `<b>Measured distance Y: ${dy.toFixed(3)}m</b><extra></extra>`
    };

    // z meassure line
    const linez = {
      x: [...measurePoints[1].x, ...measurePoints[1].x],
      y: [...measurePoints[1].y, ...measurePoints[1].y],
      z: [...measurePoints[0].z, ...measurePoints[1].z],
      mode: 'lines',
      line: {
        color: 'blue',
        width: 4,
      },
      type: 'scatter3d',
      name: 'Distance Z',
      text: ["Point 1", "Point 2"],
      hovertemplate: `<b>Measured distance X: ${dz.toFixed(3)}m</b><extra></extra>`
    };
    return (
      {
        lines: [linexyz, linex, liney, linez],
        distances: [dx, dy, dz, dxyz, dxy, dxz, dyz]
      }
    )
  }
  private updatePlotState = (plot_data: any): void => {
    this.setState({
      data: plot_data.data,
      // layout: plot_data.layout,
      // config: this.state.config,
      // frames: this.state.frames,

    })
  }
  private relayoutEventHandler = (eventData: any): void => {

    // console.log('relayout callback')
    if (eventData && eventData['scene.camera']) {
      const eye = eventData['scene.camera'].eye
      console.log('current eye', eye)
      const cameraPostion: cameraPostionObject = {
        cameraLayout: {
          x: eye.x,
          y: eye.y,
          z: eye.z
        }

      }
      // defer the initial state return because the return value from
      // the component to streamlit will be override by the layout return value
      // when we click on a point the first time the chart is initialized

      // console.log('relayout return')
      // if (this.state.deferInitialLayoutReturn === true) {
      //   console.log('deferring layout return first time')
      //   this.state.deferInitialLayoutReturn = false
      // } else {
      //   console.log('layout return')
      //   this.debouncedStreamlitReturn(JSON.stringify(cameraPostion))
      // }
      this.debouncedStreamlitReturn(JSON.stringify(cameraPostion))

    }
  }
  private debouncedStreamlitReturn: (value: string) => void;
  constructor(props: any) {
    super(props);
    this.debouncedStreamlitReturn = this.customLeadingDebounce((value: string) => {
      Streamlit.setComponentValue(value);
    }, 100);
  }

  private customLeadingDebounce = (func: (value: string) => void, wait: number) => {
    return (value: string) => {
      if (!this.isProcessing) {
        this.isProcessing = true;
        func(value);

        if (this.processingTimeout) {
          clearTimeout(this.processingTimeout);
        }

        this.processingTimeout = setTimeout(() => {
          this.isProcessing = false;
        }, wait);
      }
    };
  };
}

export default withStreamlitConnection(StreamlitPlotlyEventsComponent);