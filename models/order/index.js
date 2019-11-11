const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const { generateOrderId } = require('../../utils');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const orderSchema = new Schema(
  {
    reference: { type: String, default: generateOrderId, required: true },
    customer: { type: ObjectId, ref: 'User', required: true },
    merchant: { type: ObjectId, ref: 'User', required: true },
    planner: {
      id: { type: String },
      deliveryDate: { type: Date },
      deliveryTime: { type: String },
    },
    delayedOrder: {
      type: Number,
      default: 0,
      // 0=default 1=email sent for delay on pending 2=email sent for delay on completion
      enum: [0, 1, 2],
    },
    status: {
      type: String,
      enum: [
        'rejected',
        'pending',
        'accepted',
        'pickup ongoing',
        'pickup completed',
        'delivery ongoing',
        'delivery completed',
        'completed',
        'onging',
        'failed',
      ],
      default: 'pending',
      required: true,
    },
    pickupTime: {
      type: Number,
      required() {
        return this.status === 'accepted';
      },
    },
    items: [
      {
        product: { type: ObjectId, ref: 'Product', required: true },
        subProduct: { type: ObjectId, ref: 'Product.subProducts' },
        comboProducts: [
          {
            group: { type: ObjectId, ref: 'Product.comboProducts' },
            choice: { type: ObjectId, ref: 'Product.comboProducts.options' },
          },
        ],
        count: { type: Number, min: 1, default: 1 },
      },
    ],
    priceTotal: Number,
    payment: {
      accessCode: { type: String },
      status: {
        type: String,
        enum: ['success', 'pending', 'failed'],
        default: 'pending',
        required: true,
      },
      refund: { type: Boolean },
    },
    delivery: {
      method: String,
      price: Number,
      charge: Number,
      location: {
        state: String,
        city: String,
        address: String,
        lat: Number,
        lng: Number,
      },
      instructions: String,
    },
    servicePercentage: {
      type: Number,
      min: 0,
    },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    completedAt: { type: Date },
  },
  { timestamps: true },
);

orderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Order', orderSchema);
