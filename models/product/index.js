const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const mongoosePaginate = require('mongoose-paginate');
const ProductCategory = require('./category');

const subProductSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    priceDifference: { type: Number, default: 0 },
    unitsAvailablePerDay: Number,
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date },
  },
  { _id: true },
);

const productSchema = new Schema({
  type: { type: String, enum: ['single', 'combo'] },
  category: { type: ObjectId, ref: 'ProductCategory' },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  price: {
    type: Number,
    required: () => this.type === 'single',
  },
  calories: Number,
  discount: { type: Number, min: 0, max: 100 },
  deliveryTime: { type: Number, required: true },
  subProducts: [subProductSchema],
  subProductGroups: [
    {
      name: String,
      subProducts: [ObjectId],
    },
  ],
  comboProducts: [
    {
      product: {
        type: ObjectId,
        ref: 'Product',
        required: () => this.type === 'combo',
      },
      subProduct: {
        type: ObjectId,
        ref: 'Product.subProducts',
      },
    },
  ],
  unitsAvailablePerDay: Number,
  merchant: { type: ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date },
});

module.exports = mongoose.model('Product', productSchema);
