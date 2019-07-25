const mongoose = require('mongoose');
const {Schema} = mongoose;
const {ObjectId} = mongoose.Schema.Types;
const User = require('../user');
const MessageAttachment = require('./message-attachment.js');

const ticketMessageSchema = new Schema({
    text: String,
    attachments: [MessageAttachment],
    sender: {type: ObjectId, ref: 'User'},
    sentAt: {type: Date, default: Date.now},
});

module.export = ticketMessageSchema;
