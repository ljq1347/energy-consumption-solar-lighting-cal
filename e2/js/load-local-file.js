 
(function (global) {
    'use strict';

    function normalizePath(path) {
        return String(path).replace(/^\.\//, '').replace(/^\//, '');
    }

    function loadViaFetch(path) {
        return fetch(path).then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + path);
            }
            return response.text();
        });
    }

    function loadViaXhr(path) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', path, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) return;
                if (xhr.status === 200 || xhr.status === 0) {
                    if (xhr.responseText) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error('XHR empty response: ' + path));
                    }
                } else {
                    reject(new Error('XHR ' + xhr.status + ': ' + path));
                }
            };
            xhr.onerror = function () {
                reject(new Error('XHR network error: ' + path));
            };
            xhr.send();
        });
    }

    function readPlusEntry(entry) {
        return new Promise(function (resolve, reject) {
            entry.file(function (file) {
                var reader = new plus.io.FileReader();
                reader.onloadend = function (e) {
                    resolve(e.target.result);
                };
                reader.onerror = reject;
                reader.readAsText(file, 'utf-8');
            }, reject);
        });
    }

    function loadViaPlusIo(path) {
        return new Promise(function (resolve, reject) {
            if (typeof plus === 'undefined' || !plus.io) {
                reject(new Error('plus.io not available'));
                return;
            }
            var rel = normalizePath(path);
            var urls = ['_www/' + rel, rel];
            var i = 0;

            function tryNext() {
                if (i >= urls.length) {
                    reject(new Error('plus.io all paths failed: ' + rel));
                    return;
                }
                var url = urls[i++];
                plus.io.resolveLocalFileSystemURL(url, function (entry) {
                    readPlusEntry(entry).then(resolve, tryNext);
                }, tryNext);
            }

            tryNext();
        });
    }

    function loadLocalFile(path, options) {
        options = options || {};
        var retries = options.retries != null ? options.retries : 1;
        var loaders = [loadViaFetch, loadViaXhr, loadViaPlusIo];

        function runLoader(index) {
            if (index >= loaders.length) {
                return Promise.reject(new Error('All loaders failed: ' + path));
            }
            return loaders[index](path).catch(function (err) {
                console.warn('[loadLocalFile]', path, loaders[index].name, err.message || err);
                return runLoader(index + 1);
            });
        }

        function attempt(remaining) {
            return runLoader(0).catch(function (err) {
                if (remaining > 0) {
                    return new Promise(function (r) {
                        setTimeout(r, 300);
                    }).then(function () {
                        return attempt(remaining - 1);
                    });
                }
                throw err;
            });
        }

        return attempt(retries);
    }

    global.loadLocalFile = loadLocalFile;
})(typeof window !== 'undefined' ? window : this);
