from flask import Flask
from flask.blueprints import Blueprint
from flask.ext.cors import CORS
from raven.contrib.flask import Sentry
from flasgger import Swagger

import config
from models import db

# config your API specs
# you can define multiple specs in the case your api has multiple versions
# ommit configs to get the default (all views exposed in /spec url)
# rule_filter is a callable that receives "Rule" object and
#   returns a boolean to filter in only desired views

server = Flask(__name__)

server.config['SWAGGER'] = {
    "swagger_version": "2.0",
    "title": "Playlist Generator",
    "specs": [
        {
            "version": "0.0.1",
            "title": "Playlist Generator",
            "endpoint": 'spec',
            "route": '/playlist-generator/spec',
            "rule_filter": lambda rule: True  # all in
        }
    ],
    "static_url_path": "/playlist-generator/apidocs",
    "securityDefinitions": {
        "APIKey": {
          "type": "apiKey",
          "name": "Authorization",
          "in": "header"
        },
    },
    "security": [
        {"APIKey": []}
    ],
    "headers": []
}

if config.DEBUG:
    Swagger(server)

if config.SENTRY_DSN is not None:
    sentry = Sentry(server, dsn=config.SENTRY_DSN)
server.debug = config.DEBUG
server.config['SQLALCHEMY_DATABASE_URI'] = config.DB_URI
CORS(server, resources={r"/*": {"origins": "*"}}, headers=['Content-Type', 'X-Requested-With', 'Authorization'])
db.init_app(server)
db.app = server

import route
for blueprint in vars(route).values():
    if isinstance(blueprint, Blueprint):
        server.register_blueprint(blueprint, url_prefix=config.APPLICATION_ROOT)

from blueprint import common_blueprint
server.register_blueprint(common_blueprint, url_prefix=config.APPLICATION_ROOT)

from blueprint import get_status_blueprint
server.register_blueprint(get_status_blueprint(checking_api='PLAYLIST_GENERATOR_URL', checkDatabase=True), url_prefix=config.APPLICATION_ROOT)

if __name__ == '__main__':
    server.run(host=config.HOST, port=config.PORT)
