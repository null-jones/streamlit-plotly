import os
import streamlit.components.v1 as components
from json import loads

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
# (This is, of course, optional - there are innumerable ways to manage your
# release process.)
_RELEASE = True

# Declare a Streamlit component. `declare_component` returns a  function
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
        "my_component",
        # Pass `url` here to tell Streamlit that the component will be served
        # by the local dev server that you run via `npm run start`.
        # (This is useful while your component is in development.)
        url="http://localhost:3001",
    )
else:
    # When we're distributing a production version of the component, we'll
    # replace the `url` param with `path`, and point it to the component's
    # build directory:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("my_component", path=build_dir)


# Create a wrapper function for the component. This is an optional
# best practice - we could simply expose the component function returned by
# `declare_component` and call it done. The wrapper allows us to customize
# our component's API: we can pre-process its input args, post-process its
# output value, and add a docstring for users.
def my_component(
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
    measure_mode: bool = False
):
    """Create a new instance of "my_component".

    Parameters
    ----------
    name: str
        The name of the thing we're saying hello to. The component will display
        the text "Hello, {name}!"
    key: str or None
        An optional key that uniquely identifies this component. If this is
        None, and the component's arguments are changed, the component will
        be re-mounted in the Streamlit frontend and lose its current state.

    Returns
    -------
    int
        The number of times the component's "Click Me" button has been clicked.
        (This is the value passed to `Streamlit.setComponentValue` on the
        frontend.)

    """

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
        measure_mode = measure_mode,
    )

    # We could modify the value returned from the component if we wanted.
    # There's no need to do this in our simple example - but it's an option.
    return component_value
