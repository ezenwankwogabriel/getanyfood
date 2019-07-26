const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema.Types;
const mongoosePaginate = require('mongoose-paginate');

const orderSchema = new Schema({
  customer: { type: ObjectId, ref: 'User', required: true },
  merchant: { type: ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['rejected', 'pending', 'accepted', 'completed'],
    default: 'pending',
    required: true,
  },
  pickupTime: {
    type: Number,
    required: () => this.status === 'accepted',
  },
  products: [{ type: ObjectId, ref: 'Product', required: true }],
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date },
});

module.exports = mongoose.model('Order', orderSchema);
