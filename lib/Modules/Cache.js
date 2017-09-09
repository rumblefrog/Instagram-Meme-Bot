const fs = require('fs');

function Cache(cache) {
    this.file = cache;
}

Cache.prototype.existsSync = function(item) {
    if (fs.existsSync(this.file)) {
        fs.readFile(this.file, (err, data) => {
            if (err) return false;

            const Content = JSON.parse(data);

            return (Content.includes(item));
        });
    } else
        return false;
}

Cache.prototype.exists = function(item, callback) {
    if (fs.existsSync(this.file)) {
        fs.readFile(this.file, (err, data) => {
            if (err)
                return callback(err);

            const Content = JSON.parse(data);

            callback(null, Content.includes(item));
        });
    } else
        callback('File does not exist');
}

Cache.prototype.push = function(item, callback) {
    if (fs.existsSync(this.file)) {
        fs.readFile(this.file, (err, data) => {
            if (err)
                return callback(err);

            const Content = JSON.parse(data);

            Content.push(item);

            fs.writeFile(this.file, JSON.stringify(Content), (err) => {
                callback(err);
            });
        });
    } else {
        fs.writeFile(this.file, JSON.stringify([item]), (err) => {
            callback(err);
        });
    }
}

module.exports = Cache;
