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

  // init the component state when first starting it
  // make the layout constant across updates
  componentDidMount() {
    let plot_obj = JSON.parse(this.props.args["plot_obj"])
    let measure_mode: boolean = this.props.args['measure_mode']
    let measure_line_width: number = this.props.args['measure_line_width']
    this.setState({
      data: plot_obj.data,
      layout: { uirevision: 'constant' },
      clickedPoints: {
        x: 0,
        y: 0,
        z: 0,
      },
      measureMode: measure_mode,
      measurePoints: [],
      measureLineWidth: measure_line_width
    });
  }

  public render = (): ReactNode => {
    // Pull Plotly object from args and parse
    var plot_obj = JSON.parse(this.props.args["plot_obj"]);
    const override_height = this.props.args["override_height"];
    const override_width = this.props.args["override_width"];
    const plotClickedPoint: boolean = this.props.args['plot_clicked_point']
    const measureLineWidth: number = this.props.args['measure_line_width']
    /*Get the current point size of the chart we are plotting to draw the extra clicked point
      with respect to the scale of the plotted points
    */
    const clickedPointSize: number = this.props.args['clicked_point_size']
    // Event booleans
    const click_event = this.props.args["click_event"];
    const select_event = this.props.args["select_event"];
    const hover_event = this.props.args["hover_event"];
    const with_z = this.props.args["with_z"];

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
        style={{ width: override_width, height: override_height }}
        className="stPlotlyChart"
      />
    );
  };

  /** Click handler for plot. */
  private plotlyEventHandler = (with_z: boolean, plot_obj?: any, plot_clicked_point?: boolean, clicked_point_size?: number) => {

    // console.log('pressed on point')
    return (data: any) => {
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key: string, value: any) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return '[Circular]';
            }
            seen.add(value);
          }
          return value;
        };
      };
      // JSON.parse(data.points[0])
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

      // console.log('state point: ', this.state.clickedPoints)
      // console.log('clicked point: ',  currentClickedPoint.x)
      if (plot_clicked_point && needToUpdate === true) {

        const getPoint = data.points[0]
        const traceIndex = getPoint.curveNumber
        const pointIndex = getPoint.pointNumber
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

            const measurePlot = this.createMeasureLine(measurePoints)
            measurePoints.push(...measurePlot)
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
        console.log('plotting using: ', plot_obj)
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

        // Return array as JSON to Streamlit
        Streamlit.setComponentValue(JSON.stringify(clickedPoints));
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
      [linexyz, linex, liney, linez]
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
}

export default withStreamlitConnection(StreamlitPlotlyEventsComponent);