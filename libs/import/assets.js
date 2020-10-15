/**
 * External module Dependencies.
 */
var prompt = require('prompt'),
    Confirm = require('prompt-confirm'),
    request = require('request'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    when = require('when'),
    fs = require('fs'),
    _ = require('lodash')
sequence = require('when/sequence'),
    async = require("async");

/**
 * Internal module Dependencies.
 */

var map_asset = path.resolve("map_asset"),
    helper = require('../../libs/utils/helper.js'),
    assetsFolderPath = path.resolve(config.folder_path),
    assetFolderUid,
    delay = 500,
    mappedasset = {};

if (!fs.existsSync(map_asset)) {
    mkdirp.sync(map_asset);
}
/**
 *
 * @constructor
 */
function ImportAssets() {
    this.assets = fs.readdirSync(assetsFolderPath);
    if (fs.existsSync(path.join(map_asset, 'assets.json'))) {

        var oldAssetMap = helper.readFile(path.join(map_asset, 'assets.json')),
            oldPublishMap = helper.readFile(path.join(map_asset, 'publishAssets.json'));
        var assetUpdate = {},
            publishUpdate = {};

        for (var key in this.assets) {
            assetUpdate[this.assets[key]] = ""
            publishUpdate[this.assets[key]] = ""
        }
        var assetMap = _.mergeWith(assetUpdate, oldAssetMap);
        var assetPublishMap = _.mergeWith(publishUpdate, oldPublishMap);

        helper.writeFile(path.join(map_asset, 'assets.json'), assetMap)
        helper.writeFile(path.join(map_asset, 'publishAssets.json'), assetPublishMap)

    }
    this.requestOptions = {
        uri: client.endPoint + config.apis.assets,
        headers: {
            api_key: config.target_stack_api_key,
            authtoken: client.authtoken
        },
        method: 'POST',
        qs: {relative_urls: true,},
        json: true
    };
}

ImportAssets.prototype = {
    start: function () {
        var self = this;
        var assetTitle = {};
        return when.promise(function (resolve, reject) {
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
                        self.getAssetFolderUid()
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
        })
    },
    getAssetFolderUid: function () {
        var self = this;
        return when.promise(function (resolve, reject) {
                var data = {
                    uri: client.endPoint + config.apis.assets + "/folders/" + config.asset_folder_uid,
                    headers: {
                        api_key: config.target_stack_api_key,
                        authtoken: client.authtoken
                    },
                    method: 'GET',
                    qs: {is_dir: true, relative_urls: true,},
                    json: true
                };
                request(data, function (err, res, body) {

                     if (!err && res.statusCode == 200 && body) {
                        assetFolderUid = config.asset_folder_uid;
                        self.getAsset()
                            .then(function (result) {
                                resolve()
                            })
                            .catch(function (error) {
                                reject(error);
                            })
                    }
                    else {
                        assetFolderUid = "";
                        var confirm = new Confirm('Asset Folder Does Not exists Do You Want To Continue Upload Assets On Top Level Yes/No')
                            .run()
                            .then(function (answer) {
                                if (answer) {
                                    self.getAsset()
                                        .then(function (result) {
                                            resolve()
                                        })
                                        .catch(function (error) {
                                            reject(error);
                                        })
                                }
                            })
                    }
                })
        })
    },
    getAsset: function () {
        var self = this;
        return when.promise(function (resolve, reject) {
            if (fs.existsSync(path.join(map_asset, 'assets.json'))) {
                self.extractAssets()
                    .then(function (result) {
                        resolve()
                    })
                    .catch(function (error) {
                        reject(error);
                    })
            } else {
                for (var key in self.assets) {
                    mappedasset[self.assets[key]] = ""
                }
                helper.writeFile(path.join(map_asset, 'assets.json'), mappedasset)
                helper.writeFile(path.join(map_asset, 'publishAssets.json'), mappedasset)
                self.extractAssets()
                    .then(function (result) {
                        resolve()
                    })
                    .catch(function (error) {
                        reject(error);
                    })
            }
        })
    },
    extractAssets: function () {
        var self = this,
            masterAssets = helper.readFile(path.join(map_asset, 'assets.json')),
            _importAssests = [];

        return when.promise(function (resolve, reject) {
            for (var key in self.assets) {
                if (masterAssets[self.assets[key]] == "") {
                    var data = {
                        title: self.assets[key],
                        old_uid: key,
                        options: self.requestOptions,
                        filePath: path.join(assetsFolderPath, self.assets[key]),
                        parent_uid: config.asset_folder_uid
                    };

                    _importAssests.push(function (data) {
                        return function () {
                            return self.postAssets(data)
                        };
                    }(data));
                }
            }

            var taskResults = sequence(_importAssests);

            taskResults
                .then(function (results) {

                    var confirm = new Confirm('Do You Want To Publish Assets Yes/No')
                        .run()
                        .then(function (answer) {
                            if (answer) {
                                self.getAssetsUid(results)
                                    .then(function (result) {
                                        resolve()
                                    })
                                    .catch(function (error) {
                                        reject(error);
                                    })
                            }
                        })
                })
                .catch(function (error) {
                    console.log(error);
                    reject(error)
                });
        })
    },
    getAssetsUid: function (results) {
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


                    _publishAssets.push(function (assetOption, asset_uid) {
                        return function () {
                            return self.publishAssets(assetOption, asset_uid)
                        };
                    }(assetOption, asset_uid));
                }
            }
            var _taskResults = sequence(_publishAssets);
            _taskResults
                .then(function (results) {
                    resolve();
                })
                .catch(function (error) {
                    console.log(error);
                    reject(error)
                });
        })
    },
    publishAssets: function (assetOption, title) {
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
                        console.error('Please Provide valid locale or environment name in config.json: ')
                    }
                })
            }, delay)
        })
    },
    postAssets: function (data) {
        var self = this;
        return when.promise(function (resolve, reject) {

            const MAX_RETRY = 2;
            var retryCnt = 0;
            retryAssets();
            function retryAssets() {
                setTimeout(function () {
                    var _assets = request.post(data.options, function (err, res, body) {
                        var masterAssets = helper.readFile(path.join(map_asset, 'assets.json'))
                        if (!err && res.statusCode == 201 && body && body.asset) {
                            successLogger('Asset', data.title, ' uploaded.');
                            if (!masterAssets[data.title]) masterAssets[data.title] = body.asset.uid;
                            helper.writeFile(path.join(map_asset, 'assets.json'), masterAssets);
                            resolve(body)
                        }
                        else {
                            if (retryCnt < MAX_RETRY) {
                                retryCnt += 1;
                                var currRetryIntervalMs = (1 << retryCnt) * 500; //exponential back off logic
                                setTimeout(retryAssets, currRetryIntervalMs);
                            }
                            else {
                                if (err) {
                                    var errorcode = "'" + err.code + "'";
                                    var RETRIABLE_NETWORK_ERRORS = ['ECONNRESET', 'ENOTFOUND', 'ESOCKETTIMEDOUT', 'ETIMEDOUT', 'ECONNREFUSED', 'EHOSTUNREACH', 'EPIPE', 'EAI_AGAIN'];
                                    for (var i = 0; i < RETRIABLE_NETWORK_ERRORS.length; i++) {
                                        if (RETRIABLE_NETWORK_ERRORS[i] == errorcode) {
                                            var currRetryIntervalMs = (1 << retryCnt) * 500; //exponential back off logic
                                            setTimeout(retryAssets, currRetryIntervalMs);
                                        }
                                        else {
                                            errorLogger('Failed to Upload Asset : ', ' due to: \n', err);
                                            reject(err)
                                        }
                                    }
                                }
                            }

                            return resolve()
                        }
                    }).form();
                    _assets.append('asset[upload]', fs.createReadStream(data.filePath));
                    _assets.append('asset[parent_uid]', assetFolderUid ? data.parent_uid : "");
                }, 500)
            }
        })
    }
}

module.exports = ImportAssets;