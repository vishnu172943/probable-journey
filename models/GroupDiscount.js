const mongoose = require('mongoose');

// Schema for individual products within a group
const discountedProductSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Product ID is required']
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  featuredImage: {
    url: String,
    altText: String
  }
}, { 
  _id: true,
  timestamps: true 
});

// Schema for discount groups
const groupSchema = new mongoose.Schema({
  group: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true
  },
  percentage: {
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  discounted_products: {
    type: [discountedProductSchema],
    default: []
  }
}, { 
  _id: true,
  timestamps: true 
});

// Main schema for the group discount configuration
const groupDiscountSchema = new mongoose.Schema({
  shopId: {
    type: String,
    required: [true, 'Shop ID is required'],
    unique: true,
    trim: true
  },
  groups: {
    type: [groupSchema],
    default: [],
    validate: {
      validator: function(groups) {
        // Ensure group names are unique within the array (case-insensitive)
        const groupNames = groups.map(g => g.group.toLowerCase().trim());
        return groupNames.length === new Set(groupNames).size;
      },
      message: 'Group names must be unique'
    }
  }
}, {
  timestamps: true,
  collection: 'groupdiscounts'
});

// Single index definition (removed duplicate from shopId field definition)
groupDiscountSchema.index({ shopId: 1 });

// Instance method to add a group
groupDiscountSchema.methods.addGroup = function(groupData) {
  this.groups.push(groupData);
  return this.save();
};

// Instance method to remove a group
groupDiscountSchema.methods.removeGroup = function(groupId) {
  this.groups = this.groups.filter(g => g._id.toString() !== groupId.toString());
  return this.save();
};

// Static method to find by shop
groupDiscountSchema.statics.findByShop = function(shopId) {
  return this.findOne({ shopId });
};

module.exports = mongoose.model('GroupDiscount', groupDiscountSchema);