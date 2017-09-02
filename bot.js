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

function getReddit() {
    // request('https://www.reddit.com/r/dankmemes/.json', (err, res, body) => {
    //     if (res.statusCode != 200) {
    //         log.error('Failed to fetch Reddit posts: ' + res.statusCode);
    //         return;
    //     }

        body = fs.readFileSync('temp.json');

        const Posts = JSON.parse(body).data.children;

        const AP = Object.filter(Posts, post => !post.data.stickied);

        console.log(getUniqueItem('reddit.json', AP, 'id'));
    //});
}

function getUniqueItem(cache, items, prop) {
    if (!cache || !items || !prop) {
        log.error('UI missing param');
        return false;
    }

    if (fs.existsSync(config.settings.storage + cache)) {

        fs.readFile(config.settings.storage + cache, (err, data) => {
            if (err) {
                log.error('Failed to read ' + cache, err);
                return false;
            }

            let content = JSON.parse(data);

            let UI = items.find((item) => {
                return !content.includes(item[prop]);
            });

            if (!UI) return false;

            content.push(UI);

            fs.writeFile(config.settings.storage + cache, JSON.stringify(content), (err) => {
                if (err) {
                    log.error('Failed to write to ' + cache, err);
                    return false;
                }
                return UI;
            });
        });
    } else {
        let item = items[Math.floor(Math.random()*Object.keys(items).length)];

        fs.writeFile(config.settings.storage + cache, JSON.stringify([item[prop]]), (err) => {
            if (err) {
                log.error('Failed to write to ' + cache, err);
                return false;
            }
            return item;
        });
    }
}

Object.filter = (obj, predicate) =>
    Object.keys(obj)
          .filter( key => predicate(obj[key]) )
          .reduce( (res, key) => (res[key] = obj[key], res), {} );

getReddit();
