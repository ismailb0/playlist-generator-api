module.exports = function (shipit) {
    require('shipit-deploy')(shipit);
    require('shipit-submodule')(shipit);

    if (typeof process.env.GITHUB_USERNAME === 'undefined') {
        console.log("You must have a GITHUB_USERNAME environment variable set in order to deploy");
        exit(1);
    }

    var gitConfig = {
        'credential.username': process.env.GITHUB_USERNAME,
        'credential.helper': 'wincred'
    };

    shipit.initConfig({
        default: {
            deployTo: '/var/www/api/app/playlist-generator-api',
            gitConfig: gitConfig,
            hasDatabase: true,
            ignores: ['.git', 'node_modules'],
            keepReleases: 3,
            key: '/u/.ssh/id_rsa',
            repositoryUrl: 'https://github.com/ismailb0/playlist-generator-api.git',
            serviceName: 'playlist-generator',
            shallowClone: true,
            submodules: true,
            workspace: '/tmp/playlist-generator-api'
        },
        integration: {
            servers: [{
                host: 'ADD INTEGRATION SERVER HERE',
                user: 'ADD INTEGRATION SERVER HERE'
            }],
            branch: 'integration',
        },
        preprod: {
            servers: [{
                host: 'ADD PREPROD SERVER HERE',
                user: 'ADD PREPROD SERVER HERE'
            }, {
                host: 'ADD PREPROD SERVER HERE',
                user: 'ADD PREPROD SERVER HERE'
            }],
            branch: 'preprod',
        },
        prod: {
            servers: [{
                host: 'ADD PROD SERVER HERE',
                user: 'ADD PROD SERVER HERE'
            }, {
                host: 'ADD PROD SERVER HERE',
                user: 'ADD PROD SERVER HERE'
            }],
            branch: 'prod',
        }
    });

    shipit.on('published', function() {
        return shipit.start('install');
    });

    if(['integration', 'preprod', 'prod'].indexOf(shipit.environment) !== -1) {
      require('./devops/deploy/prod.js')(shipit);
    } else {
      console.log("Unknown environment: " + shipit.environment);
      exit(1);
    }
};
