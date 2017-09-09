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
            if (err) {
                callback(err);
            }

            const Content = JSON.parse(data);

            callback(null, Content.includes(item));
        });
    } else
        callback('File does not exist');
}

Cache.prototype.push = function(item, callback) {
    
}

module.exports = Cache;
