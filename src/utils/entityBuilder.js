// utils/entityBuilder.js
// const { P } = require('pino');
// const { slugify } = require('slugify');
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

// function slugify(token, options){
//     return token
// }

function slug(from) {
    return slugify(from, {
        replacement: '-',  // replace spaces with replacement character, defaults to `-`
        remove: undefined, // remove characters that match this regex, let to the defaults `undefined`
        lower: true,      // convert to lower case, defaults to `false`
        strict: false,     // strip special characters except replacement, defaults to `false`
        locale: 'en',      // language code of the locale to use
        trim: true         // trim leading and trailing replacement chars, defaults to `true`
    })
}

function uuid() {
    return uuidv4();
}

export { slug, uuid } ;
