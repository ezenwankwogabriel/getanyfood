const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema.Types;
const mongoosePaginate = require('mongoose-paginate');

const ticketSchema = new Schema({
  title: String,
  createdBy: { type: ObjectId, ref: 'User' },
  messages: [
    {
      text: String,
      attachments: [
        {
          type: {
            type: String,
            enum: ['image', 'file'],
          },
          url: String,
        },
      ],
      sender: { type: ObjectId, ref: 'User' },
      sentAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

ticketSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Ticket', ticketSchema);
