const config = require('./config.json');
const fs = require('fs');
const request = require('request');
const log = require('winston');
const temp = require('temp').track();
const ffmpeg = require('fluent-ffmpeg');
const getDuration = require('get-video-duration');
const sharp = require('sharp');
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

var IG;

Client.Session.create(device, storage, config.credentials.username, config.credentials.password)
    .then((session) => {
        session.getAccount()
            .then(account => log.info(`Successfully logged in as ${account.params.username}`));

        IG = session;

        log.info('Scheduled jobs for uploads');
        schedule.scheduleJob('0 13 * * *', uploadIF);
        schedule.scheduleJob('0 16 * * *', uploadIF);
        schedule.scheduleJob('0 19 * * *', uploadIF);
    });

function uploadIF() {
    Modules.IF.getMemes((err, memes) => {
        if (err) return;

        let IF_Cache = new Modules.Cache(config.settings.storage + config.settings.caches.ifunny);

        for (i = 0; i <= memes.length; i++) {
            let meta = Modules.IF.parseRawMeta(memes[i].raw_meta_data);

            if (!IF_Cache.existsSync(meta.contentId)) {

                log.debug('Post candidate found');

                IF_Cache.push(meta.contentId, (err) => {
                    if (err) return;

                    log.debug('Candidate type: ' + meta.contentType);

                    let dl_src = (meta.contentType == 'video_clip') ? memes[i].video : memes[i].image;

                    let dl_ext = Modules.IF.getContentTypeExt(meta.contentType);

                    let stream = temp.createWriteStream({prefix:'ifunny',suffix:dl_ext});

                    request(dl_src).pipe(stream).on('close', () => {
                        stream.end();
                        let final_type = (meta.contentType == 'pic') ? 'image' : 'video';

                        if (final_type == 'image') {
                            let cropped = temp.createWriteStream({prefix:'ifunny',suffix:'.jpg'});
                            log.debug('Cropping IF watermark for image upload');
                            const image = sharp(fs.readFileSync(stream.path));
                            image
                                .metadata()
                                .then((metadata) => {
                                    return image
                                        .resize(metadata.width, metadata.height - 20)
                                        .crop(sharp.gravity.north)
                                        .toFile(cropped.path)
                                })
                                .then((data) => {
                                    cropped.end();
                                    log.debug('Uploading');
                                    Client.Upload.photo(IG, cropped.path)
                                        .then((upload) => {
                                            Client.Media.configurePhoto(IG, upload.params.uploadId, Modules.IF.generateCaption(memes[i].tags, config.credentials.username));
                                        })
                                })
                        } else {
                            if (dl_ext == '.gif') {
                                let convert = temp.createWriteStream({prefix:'ifunny',suffix:'.mp4'});
                                log.debug('Converting gif -> video');
                                ffmpeg(stream.path)
                                    .output(convert)
                                    .on('end', () => {
                                        convert.end();
                                    })
                                    .on('codecData', (data) => {
                                        let thumbnail = temp.createWriteStream({prefix:'ifunny',suffix:'.jpg'});
                                        log.debug('Converting thumbnail for gif -> video upload');
                                        ffmpeg(stream.path)
                                            .frames(1)
                                            .output(thumbnail)
                                            .on('end', () => {
                                                thumbnail.end();
                                                log.debug('Uploading');
                                                Client.Upload.video(IG, convert.path, thumbnail.path)
                                                    .then((upload) => {
                                                        Client.Media.configureVideo(IG, upload.uploadId, Modules.IF.generateCaption(memes[i].tags, config.credentials.username), data.duration);
                                                    });
                                            })
                                    })
                            } else {
                                let thumbnail = temp.createWriteStream({prefix:'ifunny',suffix:'.jpg'});

                                log.debug('Downloading thumbnail for video upload');
                                request(memes[i].image).pipe(thumbnail).on('close', () => {
                                    thumbnail.end();
                                    getDuration(stream.path).then((duration) => {
                                        log.debug('Uploading');
                                        Client.Upload.video(IG, stream.path, thumbnail.path)
                                            .then((upload) => {
                                                Client.Media.configureVideo(IG, upload.uploadId, Modules.IF.generateCaption(memes[i].tags, config.credentials.username), duration);
                                            });
                                    });
                                });
                            }
                        }
                    });
                });
                log.info('Schedule ran');
                break;
            }
        }
    });
}
