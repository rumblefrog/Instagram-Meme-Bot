const config = require('./config.json');
const fs = require('fs');
const request = require('request');
const log = require('winston');
const Client = require('instagram-private-api').V1;
const device = new Client.Device(config.credentials.username);
const storage = new Client.CookieFileStorage(`${config.settings.storage}${config.credentials.username}.json`);

log.addColors({error:"red",warning:"yellow",info:"green",verbose:"white",debug:"blue",silly:"gray"});

log.remove(log.transports.Console);

log.add(log.transports.Console, {
    level: config.settings.debug_level,
    prettyPrint: true,
    colorize: true,
    timestamp: true
});

log.add(log.transports.File, {
    level: config.settings.debug_level,
    prettyPrint: true,
    filename: config.settings.storage + config.credentials.username + '.log',
    timestamp: true
});


//const Session = Client.Session.create(device, storage, config.credentials.username, config.credentials.password);

function getReddit(callback) {
    request('https://www.reddit.com/r/dankmemes/.json', (err, res, body) => {
        if (res.statusCode != 200)
            return callback('HTTP Code: ' + res.statusCode);

        const Posts = JSON.parse(body).data.children;

        const AP = [];

        Object.keys(Posts).forEach((i) => {
            if (!Posts[i].data.stickied) AP.push(Posts[i]);
        });

        if (fs.existsSync(config.settings.storage + config.settings.caches.reddit)) {
            let content = JSON.parse(fs.readFileSync(config.settings.storage + config.settings.caches.reddit));

            let UI = AP.find((item) => {
                return !content.includes(item.data.id);
            });

            if (!UI) return callback(false);

            content.push(UI.data.id);

            fs.writeFile(config.settings.storage + config.settings.caches.reddit, JSON.stringify(content), (err) => {
                if (err) {
                    log.error('Failed to write to cache: ' + err);
                    return callback(false);
                }
                return callback(null, UI.data.url);
            });
        } else {
            fs.writeFile(config.settings.storage + config.settings.caches.reddit, JSON.stringify([AP[0].data.id]), (err) => {
                if (err) {
                    log.error('Failed to write to cache: ' + err);
                    return callback(false);
                }
                return callback(null, AP[0].data.id);
            });
        }
    });
}

getReddit((err, result) => {
    console.log(result);
});
