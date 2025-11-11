 const mongoose = require('mongoose');

// Schema for excluded products (stored at shop level, applies to all groups)
const excludedProductSchema = new mongoose.Schema({
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

// Schema for discount groups (simplified - no products stored here)
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
    trim: true,
    index: true
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
  },
  excludedProducts: {
    type: [excludedProductSchema],
    default: [],
    validate: {
      validator: function(products) {
        // Ensure product IDs are unique within the array
        const productIds = products.map(p => p.productId);
        return productIds.length === new Set(productIds).size;
      },
      message: 'Product IDs must be unique in excluded products'
    }
  }
}, {
  timestamps: true,
  collection: 'groupdiscounts'
});

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

// Instance method to add excluded products
groupDiscountSchema.methods.addExcludedProducts = function(products) {
  // Remove duplicates based on productId
  const existingIds = new Set(this.excludedProducts.map(p => p.productId));
  const newProducts = products.filter(p => !existingIds.has(p.productId));
  this.excludedProducts.push(...newProducts);
  return this.save();
};

// Instance method to remove excluded product
groupDiscountSchema.methods.removeExcludedProduct = function(productId) {
  this.excludedProducts = this.excludedProducts.filter(
    p => p._id.toString() !== productId.toString()
  );
  return this.save();
};

// Static method to find by shop
groupDiscountSchema.statics.findByShop = function(shopId) {
  return this.findOne({ shopId });
};

module.exports = mongoose.model('GroupDiscount', groupDiscountSchema);