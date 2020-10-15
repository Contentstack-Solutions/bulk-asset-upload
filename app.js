var createClient = require('./libs/utils/create-client'),
    sequence = require('when/sequence'),
    prompt = require('prompt');
global.config = require('./config');
global.errorLogger = require("./libs/utils/logger.js")("error").error;
global.successLogger = require("./libs/utils/logger.js")("success").log;
global.warnLogger = require("./libs/utils/logger.js")("warn").log;
var properties = [
    {
        name: 'email',
        validator: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        required: true
    },
    {
        name: 'password',
        hidden: true,
        required: true
    }
];
prompt.start();
prompt.get(properties, function (err, result) {
    if (result) {
        createClient(config, result, function (client) {
            global.client = client;
            var modulesList = ['assets', 'publish'];
            var _import = [];
            // var migrateLocalized = config.migrateLocalized;
            if (process.argv.length == 3) {
                var val = process.argv[2];
                if (val && modulesList.indexOf(val) > -1) {
                    var ModuleExport = require('./libs/import/' + val + '.js');
                    var moduleExport = new ModuleExport();
                    _import.push(function () {
                        return moduleExport.start();
                    })
                } else {
                    errorLogger("Please provide valid module name.");
                    return 0;
                }
            } else {
                errorLogger("Only one module can be exported at a time.");
                return 0;
            }

            var taskResults = sequence(_import);

            taskResults
                .then(function (results) {
                    successLogger('Asset Upload Publish has been done. Please check logs at "libs/utils/logs" in case of failure.');
                })
                .catch(function (error) {
                    errorLogger(error);
                });

        });
    }
    else {
        errorLogger("Please provide your correct email and password")
    }
});


