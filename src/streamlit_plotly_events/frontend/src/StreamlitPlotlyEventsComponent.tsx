import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib";
import React, { ReactNode } from "react";
import Plot from 'react-plotly.js';

class StreamlitPlotlyEventsComponent extends StreamlitComponentBase {
  public render = (): ReactNode => {
    // Pull Plotly object from args and parse
    const plot_obj = JSON.parse(this.props.args["plot_obj"]);
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
        data={plot_obj.data}
        layout={plot_obj.layout}
        config={plot_obj.config}
        frames={plot_obj.frames}
        onClick={click_event ? this.plotlyEventHandler(with_z) : undefined}
        onSelected={select_event ? this.plotlyEventHandler(with_z) : undefined}
        onHover={hover_event ? this.plotlyEventHandler(with_z) : undefined}
        style={{ width: override_width, height: override_height }}
        className="stPlotlyChart"
      />
    );
  };

  /** Click handler for plot. */
  private plotlyEventHandler = (with_z: boolean) => {
    return (data: any) => {
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
