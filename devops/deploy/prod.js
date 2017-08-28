module.exports = function (shipit) {
  var supervisorService = shipit.config.fullServiceName || shipit.config.serviceName

  const servers = shipit.config.servers;
  if (!Array.isArray(servers) || servers.length < 1) {
    throw new Error('The "servers" config key must be a non-empty array.');
  }
  const firstServerIp = servers[0].host;

  shipit.blTask('initVirtualenv', function() {
    oldVenv = shipit.currentPath + "/venv"
    return shipit.remote(
      "cd " + shipit.releasePath +
      " && rm -rf venv/ " +
      " && virtualenv --no-download venv -p /usr/bin/python3" +
      " && source venv/bin/activate"
    );
  });

  shipit.blTask('installVendors', function() {
    return shipit.remote(
      "cd " + shipit.currentPath +
      " && source venv/bin/activate" +
      " && pip install \
           --find-links=/var/www/api/wheels \
           --find-links=pip_installs \
           --no-index \
           -r requirements.txt \
           --upgrade"
    );
  });

  shipit.blTask('upgradeDatabase', function() {
    // The migrations must be run on only one server, as servers share the same DB.
    return shipit.remote(
      "if ! (/usr/sbin/ifconfig | grep " + firstServerIp + "); then " +
        "echo \"Upgrade only on first server\";" +
      " else " +
        "cd " + shipit.currentPath +
        " && source venv/bin/activate" +
        " && set -a && source " + shipit.config.deployTo + "/env.conf" +
        " && export PYTHONPATH=src:utils/src" +
        " && cd " + shipit.currentPath +
        " && python3 src/manage.py db upgrade;" +
      "fi"
    );
  });

  shipit.blTask('restartServer', function() {
    return shipit.remote(
      "supervisorctl -c /etc/supervisor/supervisord.conf restart " + supervisorService
    );
  });

  // shipit.blTask('stopWatcher', function() {
  //   // push-watcher should only be stopped on one server as it it stopped by default on the second
  //   return shipit.remote(
  //     "if ! (/usr/sbin/ifconfig | grep " + firstServerIp + "); then " +
  //       "echo \"Stop only on first server\";" +
  //     " else " +
  //       "supervisorctl -c /etc/supervisor/supervisord.conf stop push-watcher;" +
  //     "fi"
  //   );
  });

  // shipit.blTask('startWatcher', function() {
  //   // push-watcher should only be started on one server as it it stopped by default on the second
  //   return shipit.remote(
  //     "if ! (/usr/sbin/ifconfig | grep " + firstServerIp + "); then " +
  //       "echo \"Start only on first server\";" +
  //     " else " +
  //       "supervisorctl -c /etc/supervisor/supervisord.conf start push-watcher;" +
  //     "fi"
  //   );
  });

  shipit.blTask('install', function() {
    if(shipit.config.serviceName == 'push'){
      var tasks = ['stopWatcher', 'installVendors', 'upgradeDatabase', 'restartServer', 'startWatcher']
    }
    else if(shipit.config.hasDatabase){
      var tasks = ['installVendors', 'upgradeDatabase', 'restartServer']
    } else {
      var tasks = ['installVendors', 'restartServer']
    }
    shipit.start(tasks, function(err) {
      if(!err){
        shipit.log('Install done!');
      }
    })
  });

  shipit.on('updated', function() {
      return shipit.start('initVirtualenv');
  });

  shipit.blTask('statsd', function() {
    return shipit.remote('echo ' + shipit.config.serviceName + '".events.deploy:1|c" | nc -w 1 -u 127.0.0.1 8125');
  });
};
