const express = require('express');
const router = express.Router();
const GroupDiscount = require('../models/GroupDiscount');

// GET - Fetch configuration by shopId
router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    
    let config = await GroupDiscount.findOne({ shopId });
    
    // If no config exists, return empty structure
    if (!config) {
      return res.json({
        success: true,
        data: {
          shopId,
          groups: []
        }
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST - Create or Update entire configuration
router.post('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { groups } = req.body;
    
    // Validate groups
    if (!Array.isArray(groups)) {
      return res.status(400).json({
        success: false,
        message: 'Groups must be an array'
      });
    }
    
    // Check for duplicate group names
    const groupNames = groups.map(g => g.group.toLowerCase());
    if (groupNames.length !== new Set(groupNames).size) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate group names are not allowed'
      });
    }
    
    const config = await GroupDiscount.findOneAndUpdate(
      { shopId },
      { 
        shopId,
        groups 
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    res.json({
      success: true,
      message: 'Configuration saved successfully',
      data: config
    });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE - Delete a specific group
router.delete('/:shopId/group/:groupId', async (req, res) => {
  try {
    const { shopId, groupId } = req.params;
    
    const config = await GroupDiscount.findOneAndUpdate(
      { shopId },
      { 
        $pull: { 
          groups: { _id: groupId } 
        } 
      },
      { new: true }
    );
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Group deleted successfully',
      data: config
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE - Delete a product from a specific group
router.delete('/:shopId/group/:groupId/product/:productId', async (req, res) => {
  try {
    const { shopId, groupId, productId } = req.params;
    
    const config = await GroupDiscount.findOneAndUpdate(
      { 
        shopId,
        'groups._id': groupId
      },
      { 
        $pull: { 
          'groups.$.discounted_products': { _id: productId } 
        } 
      },
      { new: true }
    );
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration or group not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product removed successfully',
      data: config
    });
  } catch (error) {
    console.error('Error removing product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST - Add products to a specific group
router.post('/:shopId/group/:groupId/products', async (req, res) => {
  try {
    const { shopId, groupId } = req.params;
    const { products } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Products must be an array'
      });
    }
    
    const config = await GroupDiscount.findOneAndUpdate(
      { 
        shopId,
        'groups._id': groupId
      },
      { 
        $addToSet: { 
          'groups.$.discounted_products': { $each: products } 
        } 
      },
      { new: true }
    );
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration or group not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Products added successfully',
      data: config
    });
  } catch (error) {
    console.error('Error adding products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;