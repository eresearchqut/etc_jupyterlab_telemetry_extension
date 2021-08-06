
import json
from pathlib import Path
from ._version import __version__

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": data["name"]
    }]

from .handlers import setup_handlers
# from .etc_jupyterlab_telemetry_extension import ETCJupyterLabTelemetryExtension

def _jupyter_server_extension_points():
    return [{
        "module": "etc_jupyterlab_telemetry_extension"
    }]

# def _jupyter_server_extension_points():
#     """
#     Returns a list of dictionaries with metadata describing
#     where to find the `_load_jupyter_server_extension` function.
#     """
#     return [
#         {
#             "module": "etc_jupyterlab_telemetry_extension",
#             "app": ETCJupyterLabTelemetryExtension
#         }
#     ]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    setup_handlers(server_app.web_app)
    server_app.log.info("Registered ETC JupyterLab Telemetry Extension at URL path /etc-jupyterlab-telemetry-extension")

# For backward compatibility with notebook server - useful for Binder/JupyterHub
load_jupyter_server_extension = _load_jupyter_server_extension
# load_jupyter_server_extension = ETCJupyterLabTelemetryExtension.load_classic_server_extension


