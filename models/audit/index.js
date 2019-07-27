const mongoose = require('mongoose');

const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate');

const auditSchema = new Schema({
  created_at: {
    type: Date,
    default: new Date(),
  },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  activity: String,
  agent: String,
});


auditSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('AuditTrail', auditSchema);
