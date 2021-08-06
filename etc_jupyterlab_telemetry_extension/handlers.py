from jupyter_server.utils import url_path_join
import tornado
import json
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import os, json, concurrent, tornado
from jupyter_core.paths import jupyter_config_path
from pathlib import Path

def get_config():

    try: 
        HERE = Path(__file__).parent.resolve()

        with (HERE / "labextension" / "package.json").open() as fid:
            data = json.load(fid)

        CONFIG_FILE_NAME = data['jupyterlab']['discovery']['server']['base']['name'] + '.json'
    except:
        raise Exception('The extension failed to obtain a base extension name in package.json. \
            The base extension name should be at jupyterlab.discovery.server.base.name in package.json.')

    config = None

    config_dirs = jupyter_config_path()
    config_dirs.reverse()
    for config_dir in config_dirs:

        path = os.path.join(config_dir, CONFIG_FILE_NAME)

        if os.path.isfile(path):
            with open(path) as f:
                config = json.load(f)
            break

    if not config:
        raise Exception('The ' + CONFIG_FILE_NAME + ' configuration file is missing in one of: ' + ', '.join(config_dirs))

    return config

CONFIG = get_config()

class RouteHandler(APIHandler):

    executor = concurrent.futures.ThreadPoolExecutor(5)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self, resource):
        print('GET')
        try:
            if resource == 'config':
                    if CONFIG:
                        self.finish(json.dumps(CONFIG))
                    else:
                        self.set_status(404)
            else:
                self.set_status(404)

        except Exception as e:
            self.set_status(500)
            self.finish(json.dumps(str(e)))

def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "etc-jupyterlab-telemetry-extension", "(.*)")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)