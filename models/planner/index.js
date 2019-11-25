const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const plannerSchemer = new Schema(
  {
    customer: { type: ObjectId, ref: 'User', required: true },
    reference: String,
    payment: {
      accessCode: { type: String },
      status: {
        type: String,
        enum: ['success', 'pending', 'failed'],
        default: 'pending',
      },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    priceTotal: { type: Number, default: 0 },
    orders: [
      {
        price: { type: Number },
        paid: { type: Boolean },
        merchant: { type: ObjectId, ref: 'User', required: true },
        deliveryDate: { type: Date, required: true },
        orderNumber: { type: ObjectId, ref: 'Order', required: true },
        deliveryTime: { type: String },
      },
    ],
  },
  { timestamps: { createdAt: 'createdAt' } },
);

plannerSchemer.plugin(mongoosePaginate);

module.exports = mongoose.model('Planner', plannerSchemer);
