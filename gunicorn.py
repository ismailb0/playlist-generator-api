import config as app_config

bind = "%s:%s" % (app_config.HOST, app_config.PORT)
workers = app_config.WORKER_COUNT

proc_name = "playlist-generator"

statsd_host = "127.0.0.1:8125"
statsd_prefix = "playlist-generator"
