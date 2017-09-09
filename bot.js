const config = require('./config.json');
const fs = require('fs');
const request = require('request');
const log = require('winston');
const temp = require('temp').track();
const Modules = require ('./lib/Modules');
const schedule = require('node-schedule');
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

// var IG;
//
// Client.Session.create(device, storage, config.credentials.username, config.credentials.password)
//     .then((session) => {
//         session.getAccount()
//             .then(account => log.info(`Successfully logged in as ${account.params.username}`));
//
//         IG = session;
//
//         schedule.scheduleJob('* * * * * *', hello);
//     });

var kek = new Modules.Cache('asd');
console.log(kek.exists());

//console.log(kek);
