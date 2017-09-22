const scrapeIt = require("scrape-it");

var IF = {};

IF.getMemes = function (callback) {
    scrapeIt('https://ifunny.co', {
        memes: {
            listItem: 'li .post',
            data: {
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
};

IF.getMemesFromProfile = function (callback, username) {
    scrapeIt({
        url: 'https://ifunny.co/' + username,
        headers: {
            Cookie: 'mode=list'
        }
    }, {
        memes: {
            listItem: 'li .post',
            data: {
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
};

IF.filterTags = function (tags, username) {
    let filtered = tags.filter((tag) => {
        tag = tag.toLowerCase();
        if (tag.includes('feature')) return false;
        if (tag.includes('ifunn')) return false;

        return true;
    });

    let custom_tags = [
        '#memes',
        '#' + username,
        '#memesdaily',
        '#relatable',
        '#dank',
        '#hilarious',
        '#jokes',
        '#funny',
        '#litasf',
        '#crazy',
        '#accurate',
        '#tagsomeone',
        '#instadaily',
        '#funnyshit',
        '#savage',
        '#cringe',
        '#follow',
        '#esketit'
    ];

    filtered = filtered.concat(custom_tags);

    return filtered;
};

IF.generateTags = function(tags, username) {
    let filtered = this.filterTags(tags, username);

    return `-
-
-
-
-
[ ${filtered.join(' ')} ]`;
}

IF.parseRawMeta = function (raw) {
    let meta = {};

    let pairs = raw.split(';');

    pairs.forEach((pair) => {
        let v = pair.split('=');

        meta[v[0]] = v[1];
    });

    return meta;
}

IF.getContentTypeExt = function (contentType) {
    switch (contentType) {
        case 'pic': return '.jpg';
        case 'video_clip': return '.mp4';
        case 'gif': return '.gif';
    }
}

module.exports = IF;
