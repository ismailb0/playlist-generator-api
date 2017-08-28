from flask import Blueprint, jsonify, current_app
from flask.ext.restful import Api

from api_checker import get_api_statuses

common_blueprint = Blueprint('common', __name__)
common_blueprint_api = Api(common_blueprint)

@common_blueprint.route('/routes')
def list_routes():
    output = []
    for rule in current_app.url_map.iter_rules():
        methods = ','.join(rule.methods)
        line = "{:50s} {:20s}".format(str(rule), methods)
        output.append(line)
    return jsonify(routes=output)

@common_blueprint.route('/ping')
def is_running():
    return 'OK'

def get_status_blueprint(checking_api, checkDatabase=False, additionalChecks={}):
    status_blueprint = Blueprint('status', __name__)
    status_blueprint_api = Api(status_blueprint)

    @status_blueprint.route('/status', methods=['GET'])
    def get_status():
        statuses = {
            'server': True
        }
        if checkDatabase:
            try:
                from models import db
            except ImportError:
                from flask.ext.sqlalchemy import SQLAlchemy
                db = SQLAlchemy()

            try:
                db.engine.execute('SELECT version_num FROM alembic_version')
                statuses['database'] = True
            except:
                statuses['database'] = False
        for key, checker in additionalChecks.items():
            statuses[key] = checker()

        statuses.update(get_api_statuses(checking_api))
        status_code = 200 if not (False in statuses.values()) else 418
        return jsonify(statuses), status_code
    return status_blueprint
