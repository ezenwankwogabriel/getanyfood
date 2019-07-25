const mongoose = require('mongoose');
const {Schema} = mongoose;

const messageAttachmentSchema = new Schema({
    type: {
        type: String,
        enum: ['image', 'file'],
    },
    url: String,
});

module.export = messageAttachmentSchema;
