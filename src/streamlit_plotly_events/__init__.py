import os
import streamlit.components.v1 as components
from json import loads

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
# (This is, of course, optional - there are innumerable ways to manage your
# release process.)
_RELEASE = True

# Declare a Streamlit component. `declare_component` returns a function
# that is used to create instances of the component. We're naming this
# function "_component_func", with an underscore prefix, because we don't want
# to expose it directly to users. Instead, we will create a custom wrapper
# function, below, that will serve as our component's public API.

# It's worth noting that this call to `declare_component` is the
# *only thing* you need to do to create the binding between Streamlit and
# your component frontend. Everything else we do in this file is simply a
# best practice.

if not _RELEASE:
    _component_func = components.declare_component(
        # We give the component a simple, descriptive name ("my_component"
        # does not fit this bill, so please choose something better for your
        # own component :)
        "plotly_events",
        # Pass `url` here to tell Streamlit that the component will be served
        # by the local dev server that you run via `npm run start`.
        # (This is useful while your component is in development.)
        url="http://localhost:3001",
    )
else:
    # When we're distributing a production version of the component, we'll
    # replace the `url` param with `path`, and point it to to the component's
    # build directory:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("plotly_events", path=build_dir)


# Create a wrapper function for the component. This is an optional
# best practice - we could simply expose the component function returned by
# `declare_component` and call it done. The wrapper allows us to customize
# our component's API: we can pre-process its input args, post-process its
# output value, and add a docstring for users.
def plotly_events(
    plot_fig,
    click_event=True,
    with_z=False,
    select_event=False,
    hover_event=False,
    override_height=450,
    override_width="100%",
    key=None,
    plot_clicked_point: bool = False,
    clicked_point_size: float = 0.0,
    measure_mode: bool = False,
    measure_line_width: float = 4.0,
    get_relayout: bool = False,
):
    """Create a new instance of "plotly_events".

    Parameters
    ----------
    plot_fig: Plotly Figure
        Plotly figure that we want to render in Streamlit
    click_event: boolean, default: True
        Watch for click events on plot and return point data when triggered
    select_event: boolean, default: False
        Watch for select events on plot and return point data when triggered
    hover_event: boolean, default: False
        Watch for hover events on plot and return point data when triggered
    override_height: int, default: 450
        Integer to override component height.  Defaults to 450 (px)
    override_width: string, default: '100%'
        String (or integer) to override width.  Defaults to 100% (whole width of iframe)
    key: str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.
    plot_clicked_point: bool
        An optional key if you want the clicked point on the chart to have a red point drawn
        to indicate where you clicked (Stable for Scatter 3d plots not yet tested on other types)
    clicked_point_size: float
        What size to plot the clicked point, will work make a difference when plot_clicked_point is True
    measure_mode: bool
        Plot measurements after clicking 2 points on the chart, will modify the return value of the component
        Measurement and plotting is done is in component space so no need to rerun
    measure_line_width: float
        What line width to plot when measurement is done,

    Returns
    -------
    list of dict
        List of dictionaries containing point details (in case multiple overlapping
        points have been clicked).

        Details can be found here:
            https://plotly.com/javascript/plotlyjs-events/#event-data

        Format of dict:
            {
                x: float (x value of point),
                y: float (y value of point),
                z: float (z value of point), # optional enabled using with_z
                curveNumber: (index of curve),
                pointNumber: (index of selected point),
                pointIndex: (index of selected point)
            }

        If measurement is enabled:
            {
                x: float (x value of point),
                y: float (y value of point),
                z: float (z value of point), # optional enabled using with_z
                curveNumber: (index of curve),
                pointNumber: (index of selected point),
                pointIndex: (index of selected point)
            },
            {
                measurePointsX: (list of measurement points x value),
                measurePointsY: (list of measurement points y value),
                measurePointsZ: (list of measurement poitns z value),
                dx: (delta x of measurement points, 0 when only one point is clicked),
                dy: (delta y of measurement points, 0 when only one point is clicked),
                dz: (delta z of measurement points, 0 when only one point is clicked)
                dxyz: (delta xyz of measurement points, 0 when only one points is clicked)
                dxy: (delta xy of measurement points, 0 when only one point is clicked),
                dxz: (delta xz of measurement points, 0 when only one point is clicked),
                dyz: (delta yz of measurement points, 0 when only one point is clicked)
            }
        If get_relayout is enabled, additional returns will happen when the chart is moved around
        {
            cameraLayout: {
                x: float (x camera position)
                y: float (y camera position)
                z: float (z camera position)
            }
        }
        different dictionaries will be returned so you need to handle them

    """
    # kwargs will be exposed to frontend in "args"
    component_value = _component_func(
        plot_obj=plot_fig.to_json(),
        override_height=override_height,
        override_width=override_width,
        key=key,
        click_event=click_event,
        with_z=with_z,
        select_event=select_event,
        hover_event=hover_event,
        default="[]",
        plot_clicked_point=plot_clicked_point,
        clicked_point_size=clicked_point_size,
        measure_mode=measure_mode,
        measure_line_width=measure_line_width,
        get_relayout=get_relayout
    )

    # Parse component_value since it's JSON and return to Streamlit
    return loads(component_value)


# Add some test code to play with the component while it's in development.
# During development, we can run this just as we would any other Streamlit
# app: `$ streamlit run src/streamlit_plotly_events/__init__.py`
if not _RELEASE:
    import streamlit as st
    import plotly.express as px

    st.set_page_config(layout="wide")

    st.subheader("Plotly Line Chart")
    fig = px.line(x=[0, 1, 2, 3], y=[0, 1, 2, 3])
    plot_name_holder = st.empty()
    clickedPoint = plotly_events(fig, key="line")
    plot_name_holder.write(f"Clicked Point: {clickedPoint}")

    # Here we add columns to check auto-resize/etc
    st.subheader("Plotly Bar Chart (With columns)")
    _, c2, _ = st.columns((1, 6, 1))
    with c2:
        fig2 = px.bar(x=[0, 1, 2, 3], y=[0, 1, 2, 3])
        plot_name_holder2 = st.empty()
        clickedPoint2 = plotly_events(fig2, key="bar")
        plot_name_holder2.write(f"Clicked Point: {clickedPoint2}")

    st.subheader("# Plotly Select Event")
    fig3 = px.bar(x=[0, 1, 2, 3], y=[0, 1, 2, 3])
    plot_name_holder3 = st.empty()
    clickedPoint3 = plotly_events(
        fig3, key="select", click_event=False, select_event=True
    )
    plot_name_holder3.write(f"Selected Point: {clickedPoint3}")

    st.subheader("# Plotly Hover Event")
    fig4 = px.bar(x=[0, 1, 2, 3], y=[0, 1, 2, 3])
    plot_name_holder4 = st.empty()
    clickedPoint4 = plotly_events(
        fig4, key="hover", click_event=False, hover_event=True
    )
    plot_name_holder4.write(f"Hovered Point: {clickedPoint4}")
