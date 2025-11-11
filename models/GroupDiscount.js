 const mongoose = require('mongoose');

// Simple group schema - only name and percentage
const groupSchema = new mongoose.Schema({
  group: {
    type: String,
    required: true,
    trim: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { 
  _id: true,
  timestamps: true,
  strict: true
});

// Main discount configuration schema
const groupDiscountSchema = new mongoose.Schema({
  shopId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  groups: {
    type: [groupSchema],
    default: []
  },
  excludedProducts: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  strict: true,
  collection: 'groupdiscounts'
});

// Create index
groupDiscountSchema.index({ shopId: 1 });

module.exports = mongoose.model('GroupDiscount', groupDiscountSchema);