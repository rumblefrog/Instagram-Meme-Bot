const scrapeIt = require("scrape-it");

var IF = {};

IF.getMemes = function (callback) {
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
};

IF.filterTags = function (tags) {
    tags.filter((tag) => {
        tag = tag.toLowerCase();
        if (tag.includes('feature')) return false;
        if (tag.includes('ifunn')) return false;

        return true;
    });
};

module.exports = IF;
