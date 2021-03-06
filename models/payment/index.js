const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const paymentSchema = new Schema(
  {
    merchant: { type: ObjectId, ref: 'User', required: true },
    amount: { type: String, required: true },
    transactionNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: Number, required: true },
    status: { type: Boolean, default: false },
  },
  { timestamps: true },
);

paymentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Payment', paymentSchema);
