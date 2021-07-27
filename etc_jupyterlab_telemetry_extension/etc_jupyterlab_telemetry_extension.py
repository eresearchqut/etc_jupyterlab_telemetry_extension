from jupyter_server.extension.application import ExtensionApp
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin
from jupyter_server.utils import url_path_join
import tornado
import json

from traitlets.traitlets import Bool, Dict, Integer, Unicode 

class ConfigRouteHandler(ExtensionHandlerMixin, JupyterHandler):

    @tornado.web.authenticated
    def get(self):
        # print('ConfigRouteHandler#settings', self.settings)
        # print('ConfigRouteHandler#config', self.config)
        # print('ConfigRouteHandler#server_config', self.server_config)
        # print('ConfigRouteHandler#name', self.name)
        config = self.config['etc_jupyterlab_telemetry_extension'] if 'etc_jupyterlab_telemetry_extension' in self.config else {}
        self.finish(json.dumps(config))

class ETCJupyterLabTelemetryExtension(ExtensionApp):

    # -------------- Required traits --------------
    name = "etc_jupyterlab_telemetry_extension"
    default_url = "/etc-jupyterlab-telemetry-extension"
    load_other_extensions = True
    file_url_prefix = "/render"

    # --- ExtensionApp traits you can configure ---
    # static_paths = []
    # template_paths = []
    # settings = {}
    # handlers = []

    # ----------- add custom traits below ---------
    # ...

    etc_jupyterlab_telemetry_extension = Dict(value_trait=Dict(value_trait=Bool(), key_trait=Unicode()), key_trait=Unicode()).tag(config=True)

    def initialize_settings(self):
        pass
        # Update the self.settings trait to pass extra
        # settings to the underlying Tornado Web Application.
        # self.settings.update({'<trait>':...})

    def initialize_handlers(self):
        # Extend the self.handlers trait
        base_url = self.settings["base_url"]
        route_pattern = url_path_join(base_url, "etc-jupyterlab-telemetry-extension", "config")
        handlers = [(route_pattern, ConfigRouteHandler)]
        self.handlers.extend(handlers)

    def initialize_templates(self):
        pass
        # Change the jinja templating environment

    async def stop_extension(self):
        pass
        # Perform any required shut down steps


