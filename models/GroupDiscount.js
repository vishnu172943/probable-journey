const mongoose = require('mongoose');

const discountedProductSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  featuredImage: {
    url: String,
    altText: String
  }
}, { _id: true });

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
  },
  discounted_products: [discountedProductSchema]
}, { _id: true });

const groupDiscountSchema = new mongoose.Schema({
  shopId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  groups: {
    type: [groupSchema],
    validate: {
      validator: function(groups) {
        // Ensure group names are unique within the array
        const groupNames = groups.map(g => g.group.toLowerCase());
        return groupNames.length === new Set(groupNames).size;
      },
      message: 'Group names must be unique'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GroupDiscount', groupDiscountSchema);