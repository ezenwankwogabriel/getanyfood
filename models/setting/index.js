const mongoose = require('mongoose');

const { Schema } = mongoose;

const stateSettingSchema = new Schema(
  {
    state: {
      type: String,
      required: true,
    },
    cities: [String],
    deliveryCharge: { type: Number, min: 0, required: true },
    servicePercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
  },
  { _id: true },
);

const settingSchema = new Schema(
  {
    orderAcceptanceWindow: Number,
    availableStates: [stateSettingSchema],
  },
  { timestamps: true },
);

settingSchema.method('stateSettings', function stateSettings(inputState) {
  const matchingStates = this.availableStates.filter(
    ({ state }) => state.toLowerCase() === inputState.toLowerCase(),
  );
  if (!matchingStates.length) {
    throw new Error(`Services not available in this state yet: ${inputState}`);
  }
  return matchingStates[0];
});

module.exports = mongoose.model('Setting', settingSchema);
