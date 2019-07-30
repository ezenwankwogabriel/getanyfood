const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const mongoosePaginate = require('mongoose-paginate');

const promotionSchema = new Schema({
  merchant: { type: ObjectId, ref: 'User', required: true },
  catchPhrase: { type: String, maxlength: 25 },
  discount: { type: Number, min: 0, max: 100 },
  item: {
    product: {
      type: ObjectId,
      ref: 'Product',
      required: true,
    },
    subProduct: {
      type: ObjectId,
      ref: 'Product.subProducts',
    },
  },
  createdAt: { type: Date, default: Date.now, required: true },
  expiresAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date },
});

promotionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Promotion', promotionSchema);
