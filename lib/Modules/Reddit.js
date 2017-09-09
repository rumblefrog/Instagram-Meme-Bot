const request = require('request');

var Reddit = {};

Reddit.getMemes = function (callback) {
    request('https://www.reddit.com/r/dankmemes/.json', (err, res, body) => {
        if (res.statusCode != 200)
            return callback('HTTP Code: ' + res.statusCode);

        const Posts = JSON.parse(body).data.children;

        callback(null, Posts);
    });
};

module.exports = Reddit;
