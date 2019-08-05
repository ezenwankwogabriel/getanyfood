const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const productCategorySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  merchant: { type: ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date },
});

module.exports = mongoose.model('ProductCategory', productCategorySchema);
