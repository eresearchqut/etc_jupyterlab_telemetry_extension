import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin
import tornado

class RouteHandler(ExtensionHandlerMixin, JupyterHandler):

    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        # self.finish(json.dumps({
        #     "data": "This is /etc-jupyterlab-telemetry-extension/get_example endpoint!"
        # }))
        print(self.config)
        self.finish(json.dumps({
            "data": "This is /etc-jupyterlab-telemetry-extension/get_example endpoint!"
        }))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "etc-jupyterlab-telemetry-extension", "get_example")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
