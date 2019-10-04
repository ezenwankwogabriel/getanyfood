const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const mongoosePaginate = require('mongoose-paginate');
const mongooseTextSearch = require('mongoose-text-search');

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

const comboProductOptionSchema = new Schema(
  {
    name: { type: String, trim: true },
    priceIncrement: { type: Number, min: 0, default: 0 },
    calories: { type: Number },
  },
  { _id: true },
);

const comboProductSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      required() {
        return this.type === 'combo';
      },
    },
    options: [comboProductOptionSchema],
  },
  { _id: true },
);

const productSchema = new Schema({
  type: { type: String, lowercase: true, enum: ['single', 'combo'] },
  category: { type: ObjectId, ref: 'ProductCategory' },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  price: {
    type: Number,
    required: true,
  },
  calories: Number,
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  deliveryTime: { type: Number, required: true },
  deliveryType: { type: String, enum: ['free', 'paid'], default: 'paid' },
  subProducts: [subProductSchema],
  subProductGroups: [
    {
      name: String,
      subProducts: [ObjectId],
    },
  ],
  comboProducts: [comboProductSchema],
  unitsAvailablePerDay: Number,
  merchant: { type: ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date },
});

productSchema.index({ name: 'text', 'subProduct.name': 'text' });

productSchema.plugin(mongoosePaginate);

productSchema.plugin(mongooseTextSearch);

module.exports = mongoose.model('Product', productSchema);
