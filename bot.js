const config = require('./config.json');
const fs = require('fs');
const request = require('request');
const log = require('winston');
const temp = require('temp').track();
const scrapeIt = require("scrape-it");
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

// Client.Session.create(device, storage, config.credentials.username, config.credentials.password)
//     .then((session) => {
//         getReddit((err, result) => {
//             if (!err) {
//                 let stream = temp.createWriteStream({prefix:'image',suffix:'.jpg'});
//                 request(result.data.url).pipe(stream).on('close', () => {
//                     stream.end();
//                     Client.Upload.photo(session, stream.path)
//                         .then((upload) => {
//                             console.log(upload.params.uploadId);
//                             return Client.Media.configurePhoto(session, upload.params.uploadId, result.data.title);
//                         })
//                         .then((medium) => {
//                             console.log(medium.params)
//                         })
//                 });
//             }
//         });
//     })

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
                return callback(null, UI);
            });
        } else {
            fs.writeFile(config.settings.storage + config.settings.caches.reddit, JSON.stringify([AP[0].data.id]), (err) => {
                if (err) {
                    log.error('Failed to write to cache: ' + err);
                    return callback(false);
                }
                return callback(null, AP[0]);
            });
        }
    });
}

function getiFunny(callback) {
    scrapeIt({
        url: 'https://ifunny.co/RumbleFrog',
        headers: {
            Cookie: 'mode=list'
        }
    }, {
        memes: {
            listItem: 'li .post',
            data: {
                type: {
                    selector: '.js-media',
                    attr: 'data-source',
                    convert: src => (src) ? 'video' : 'image'
                },
                image: {
                    selector: '.media__image',
                    attr: 'src'
                },
                video: {
                    selector: '.js-media',
                    attr: 'data-source'
                },
                tags: {
                    listItem: '.tagpanel > .tagpanel__item > a'
                },
                raw_meta_data: {
                    selector: '.post__toolbar .js-dwhcollector-action',
                    attr: 'data-dwhevent-props'
                }
            }
        }
    })
    .then(page => callback(null, page.memes))
    .catch(err => callback(err));
}

getiFunny((err, lul) => {
    console.log(lul);
});
