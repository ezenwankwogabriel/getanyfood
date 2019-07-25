const mongoose = require('mongoose');
const {Schema} = mongoose;
const {ObjectId} = mongoose.Schema.Types;
var mongoosePaginate = require('mongoose-paginate');
const User = require('../user');
const TicketMessage = require('./message.js');

const ticketSchema = new Schema({
    title: String,
    createdBy: {type: ObjectId, ref: 'User'},
    messages: [TicketMessage],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
});

module.exports = mongoose.model('Ticket', ticketSchema);
