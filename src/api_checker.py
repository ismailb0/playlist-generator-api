import requests
import config

API_LIST = ['AUTHENTICATOR_URL', 'BACKTEST_URL', 'COMPETITION_URL', 'DATAEXPORT_URL', 'FUNDS_HISTORY_URL', 'MAILER_URL', 'PDF_URL', 'PUSH_RAW_URL', 'PUSH_URL', 'QUIZ_URL', 'SERIOUS_GAME_URL', 'SUBSCRIPTION_URL', 'TRANSLATION_URL']

def is_running(api_url):
    try:
        url = getattr(config, api_url) + "/ping"
        response = requests.get(url)
        return {api_url: response.status_code == 200}
    except:
        return {api_url: False}

def get_api_statuses(checking_api):
    statuses = {}
    for api_url in API_LIST:
        if api_url != checking_api:
            statuses.update(is_running(api_url))
    return statuses
