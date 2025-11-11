const mongoose = require('mongoose');

// Schema for discount groups (simple - just name and percentage)
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
  // ✅ Simplified: Just an array of product IDs (Shopify GIDs)
  excludedProducts: {
    type: [String],
    default: [],
    validate: {
      validator: function(products) {
        // Ensure product IDs are unique
        return products.length === new Set(products).size;
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

// Instance method to add excluded product IDs
groupDiscountSchema.methods.addExcludedProducts = function(productIds) {
  const uniqueIds = [...new Set([...this.excludedProducts, ...productIds])];
  this.excludedProducts = uniqueIds;
  return this.save();
};

// Instance method to remove excluded product ID
groupDiscountSchema.methods.removeExcludedProduct = function(productId) {
  this.excludedProducts = this.excludedProducts.filter(id => id !== productId);
  return this.save();
};

// Static method to find by shop
groupDiscountSchema.statics.findByShop = function(shopId) {
  return this.findOne({ shopId });
};

module.exports = mongoose.model('GroupDiscount', groupDiscountSchema);