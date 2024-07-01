import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib";
import React, { ReactNode } from "react";
import Plot from 'react-plotly.js';
import { trace } from "console";

class StreamlitPlotlyEventsComponent extends StreamlitComponentBase {
  // Create state for points
  state = {
    data: [],
    layout: {},
    frames: [],
    config: {}
  };

  componentDidMount() {
    var plot_obj = JSON.parse(this.props.args["plot_obj"]);
    this.setState({
      data: plot_obj.data,
      layout: plot_obj.layout,
      frames: plot_obj.frames,
      config: plot_obj.config
    });
  }

  public render = (): ReactNode => {
    // Pull Plotly object from args and parse
    var plot_obj = JSON.parse(this.props.args["plot_obj"]);

    // this.setState({
    //   data: plot_obj.data,
    //   layout: plot_obj.layout,
    //   frames: plot_obj.frames,
    //   config: plot_obj.config,
    // })

    const override_height = this.props.args["override_height"];
    const override_width = this.props.args["override_width"];

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
        config={this.state.config}
        frames={this.state.frames}
        onClick={click_event ? this.plotlyEventHandler(with_z, plot_obj) : undefined}
        onSelected={select_event ? this.plotlyEventHandler(with_z) : undefined}
        onHover={hover_event ? this.plotlyEventHandler(with_z) : undefined}
        style={{ width: override_width, height: override_height }}
        className="stPlotlyChart"
      />
    );
  };

  /** Click handler for plot. */
  private plotlyEventHandler = (with_z: boolean, plot_obj?: any) => {

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
      const getPoint = data.points[0]
      const traceIndex = getPoint.curveNumber
      const pointIndex = getPoint.pointNumber

      // console.log(plot_obj)
      // console.log('current point number:', pointIndex)
      // console.log('current trace number', traceIndex)
      // console.log('current colors: ', plot_obj.data[traceIndex].marker.color[pointIndex])
      // console.log('current point size',plot_obj.data[traceIndex].marker)
      // set the color by modifying the state of data here

      // const newData = plot_obj
      plot_obj.data[traceIndex].marker.color[pointIndex] = 'red'
      
      this.setState({
        data:plot_obj.data
      })
      
      // Build array of points to return
      var clickedPoints: Array<any> = [];
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
    };
  };
}

export default withStreamlitConnection(StreamlitPlotlyEventsComponent);