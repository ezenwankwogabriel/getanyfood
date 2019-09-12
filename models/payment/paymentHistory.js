const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const paymentHistorySchema = new Schema(
  {
    merchant: { type: ObjectId, ref: 'User', required: true },
    customer: { type: ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { type: String },
  },
  { timestamps: true },
);

paymentHistorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
