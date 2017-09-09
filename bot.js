const config = require('./config.json');
const fs = require('fs');
const request = require('request');
const log = require('winston');
const temp = require('temp').track();
const ffmpeg = require('fluent-ffmpeg');
const getDuration = require('get-video-duration');
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

var IG;

Client.Session.create(device, storage, config.credentials.username, config.credentials.password)
    .then((session) => {
        session.getAccount()
            .then(account => log.info(`Successfully logged in as ${account.params.username}`));

        IG = session;

        //schedule.scheduleJob('* * * * * *', hello);
        setTimeout(uploadIF, 1000);
    });

function uploadIF() {
    Modules.IF.getMemes((err, memes) => {
        if (err) return;

        let IF_Cache = new Modules.Cache(config.settings.storage + config.settings.caches.ifunny);

        for (i = 0; i <= memes.length; i++) {
            let meta = Modules.IF.parseRawMeta(memes[i].raw_meta_data);

            if (!IF_Cache.existsSync(meta.contentId)) {

                // console.log(Modules.IF.filterTags(memes[i].tags).join(' '));
                //
                // return;

                IF_Cache.push(meta.contentId, (err) => {
                    if (err) return;

                    let dl_src = (meta.contentType == 'video_clip') ? memes[i].video : memes[i].image;

                    let dl_ext = Modules.IF.getContentTypeExt(meta.contentType);

                    let stream = temp.createWriteStream({prefix:'ifunny',suffix:dl_ext});

                    request(dl_src).pipe(stream).on('close', () => {
                        stream.end();

                        let final_type = (meta.contentType == 'pic') ? 'image' : 'video';

                        if (final_type == 'image') {
                            Client.Upload.photo(IG, stream.path)
                                .then((upload) => {
                                    Client.Media.configurePhoto(IG, upload.params.uploadId, Modules.IF.filterTags(memes[i].tags, config.credentials.username).join(' '));
                                });
                        } else {
                            if (dl_ext == '.gif') {
                                let convert = temp.createWriteStream({prefix:'ifunny',suffix:'.mp4'});
                                ffmpeg(stream.path)
                                    .output(convert)
                                    .on('end', () => {
                                        convert.end();
                                    })
                                    .on('codecData', (data) => {
                                        let thumbnail = temp.createWriteStream({prefix:'ifunny',suffix:'.jpg'});
                                        ffmpeg(stream.path)
                                            .frames(1)
                                            .output(thumbnail)
                                            .on('end', () => {
                                                thumbnail.end();

                                                Client.Upload.video(IG, convert.path, thumbnail.path)
                                                    .then((upload) => {
                                                        Client.Media.configureVideo(IG, upload.uploadId, Modules.IF.filterTags(memes[i].tags, config.credentials.username).join(' '), data.duration);
                                                    });
                                            })
                                    })
                            } else {
                                let thumbnail = temp.createWriteStream({prefix:'ifunny',suffix:'.jpg'});

                                request(memes[i].image).pipe(thumbnail).on('close', () => {
                                    thumbnail.end();
                                    getDuration(stream.path).then((duration) => {
                                        Client.Upload.video(IG, stream.path, thumbnail.path)
                                            .then((upload) => {
                                                Client.Media.configureVideo(IG, upload.uploadId, Modules.IF.filterTags(memes[i].tags, config.credentials.username).join(' '), duration);
                                            });
                                    });
                                });
                            }
                        }
                    });
                });
                break;
            }
        }
    });
}

//uploadIF();
