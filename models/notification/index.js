const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const mongoosePaginate = require('mongoose-paginate');

const notificationSchema = new Schema({
  notificationTo: { type: ObjectId, ref: 'User', required: true },
  noticationFrom: { type: ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'createdAt' } });

notificationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Notification', notificationSchema);
