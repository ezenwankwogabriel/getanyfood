const mongoose = require('mongoose');

const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate');

const vendorSchema = new Schema({
  vendors: Array,
}, { timestamps: { createdAt: 'createdAt' } });

vendorSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('VendorType', vendorSchema);
