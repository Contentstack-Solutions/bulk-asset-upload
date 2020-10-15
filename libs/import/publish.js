/**
 * External module Dependencies.
 */
var request = require('request'),
    path = require('path'),
    when = require('when'),
    fs = require('fs'),
    sequence = require('when/sequence'),
    map_asset = path.resolve("map_asset"),
    delay = 500,
    helper = require('../../libs/utils/helper.js');

function AssetsPublish() {
}
AssetsPublish.prototype = {
    start: function () {
        var self = this
        return when.promise(function (resolve, reject) {
            if (fs.existsSync(map_asset)) {
                var stackUrl = {
                    uri: client.endPoint +'/stacks',
                    headers: {
                        api_key: config.target_stack_api_key,
                        authtoken: client.authtoken
                    },
                    method: 'GET'
                };
                request(stackUrl, function (err, res, body) {
                    if (!err && res.statusCode == 200 && body) {
                        self.getAssetsUid()
                            .then(function (result) {
                                resolve()
                            })
                            .catch(function (error) {
                                reject(error);
                            })
                    }
                    else{
                        console.error("Please Provide Valid Stack API Key")
                    }
                })
            }
            else {
                errorLogger("Please upload assests first")
            }
        })
    },
    getAssetsUid: function () {
        var self = this,
            _publishAssets = [],
            publishAssets = helper.readFile(path.join(map_asset, 'publishAssets.json'));

        return when.promise(function (resolve, reject) {
            var assetfile = helper.readFile(path.join(map_asset, 'assets.json'));
            for (var asset_uid in assetfile) {
                if (publishAssets[asset_uid] == "") {
                    var assetOption = {
                        uri: client.endPoint + config.apis.assets + "/" + assetfile[asset_uid] + "/publish",
                        headers: {
                            api_key: config.target_stack_api_key,
                            authtoken: client.authtoken
                        },
                        method: 'POST',
                        qs: {
                            asset: {
                                locales: [
                                    config.locale
                                ],
                                environments: [
                                    config.environment
                                ]
                            },
                            relative_urls: true
                        },
                        json: true
                    }

                    _publishAssets.push(function (assetOption,asset_uid) {
                        return function () {
                            return self.publishAssets(assetOption,asset_uid)
                        };
                    }(assetOption,asset_uid));
                }
            }
            var _taskResults = sequence(_publishAssets);
            _taskResults
                .then(function (results) {
                    resolve();
                })
                .catch(function (error) {
                    reject(error)
                });
        })
    },
    publishAssets: function (assetOption,title) {
        var self = this;
        return when.promise(function (resolve, reject) {
            var publishAssets = helper.readFile(path.join(map_asset, 'publishAssets.json'))
            setTimeout(function () {
                request(assetOption, function (err, res, body) {
                    if (!err && res.statusCode == 201 && body) {
                        successLogger(body.notice);
                        if (!publishAssets[title]) publishAssets[title] = body.notice;
                        helper.writeFile(path.join(map_asset, 'publishAssets.json'), publishAssets);
                        resolve(body)
                    }
                    else {
                        reject()
                    }
                })
            },delay)
        })
    }
}
module.exports = AssetsPublish;
