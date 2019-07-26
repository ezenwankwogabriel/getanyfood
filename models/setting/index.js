const mongoose = require('mongoose');

const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate');

const settingSchema = new Schema({
  servicePercentage: { type: Number, min: 0, max: 100 },
  orderAcceptanceWindow: Number,
  deliveryCharge: Number,
  availableStates: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Setting', settingSchema);
