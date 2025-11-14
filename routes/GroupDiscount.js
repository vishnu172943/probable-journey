 const express = require('express');
const router = express.Router();
const GroupDiscount = require('../models/GroupDiscount');

// @route   GET /api/group-discount/:shopId
// @desc    Get configuration by shopId
// @access  Public
router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    
    if (!shopId || shopId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Shop ID is required'
      });
    }
    
    let config = await GroupDiscount.findOne({ shopId: shopId.trim() });
    
    // If no config exists, return empty structure
    if (!config) {
      return res.json({
        success: true,
        data: {
          shopId: shopId.trim(),
          groups: [],
          excludedProducts: []
        },
        message: 'No configuration found for this shop'
      });
    }
    
    console.log('✅ GET config:', {
      shopId: config.shopId,
      groupsCount: config.groups?.length,
      excludedProductsCount: config.excludedProducts?.length,
      excludedProducts: config.excludedProducts
    });
    
    res.json({
      success: true,
      data: config,
      message: 'Configuration retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/group-discount/:shopId
// @desc    Create or Update entire configuration (groups + excluded products)
// @access  Public
router.post('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { groups, excludedProducts } = req.body;
    
    console.log('📦 POST /:shopId - Request received');
    console.log('📦 shopId:', shopId);
    console.log('📦 groups count:', groups?.length);
    console.log('📦 excludedProducts:', excludedProducts);
    console.log('📦 excludedProducts type:', typeof excludedProducts);
    console.log('📦 excludedProducts is array:', Array.isArray(excludedProducts));
    
    // Validation
    if (!shopId || shopId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Shop ID is required'
      });
    }
    
    if (!Array.isArray(groups)) {
      return res.status(400).json({
        success: false,
        message: 'Groups must be an array'
      });
    }
    
    // Validate each group
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!group.group || group.group.trim() === '') {
        return res.status(400).json({
          success: false,
          message: `Group name is required for group at index ${i}`
        });
      }
      if (group.percentage === undefined || group.percentage === null) {
        return res.status(400).json({
          success: false,
          message: `Discount percentage is required for group "${group.group}"`
        });
      }
      if (group.percentage < 0 || group.percentage > 100) {
        return res.status(400).json({
          success: false,
          message: `Discount percentage must be between 0 and 100 for group "${group.group}"`
        });
      }
    }
    
    // Check for duplicate group names (case-insensitive)
    const groupNames = groups.map(g => g.group.toLowerCase().trim());
    const uniqueNames = new Set(groupNames);
    if (groupNames.length !== uniqueNames.size) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate group names are not allowed'
      });
    }
    
    // Prepare update data
    const updateData = {
      shopId: shopId.trim(),
      groups: groups
    };
    
    // Handle excludedProducts - always set it (even if empty array)
    if (excludedProducts !== undefined) {
      if (!Array.isArray(excludedProducts)) {
        return res.status(400).json({
          success: false,
          message: 'Excluded products must be an array'
        });
      }
      // Store only product IDs (strings)
      updateData.excludedProducts = excludedProducts;
    }
    
    console.log('💾 Update data:', JSON.stringify(updateData, null, 2));
    
    // Update or create configuration
    const config = await GroupDiscount.findOneAndUpdate(
      { shopId: shopId.trim() },
      updateData,
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    console.log('✅ Saved config:', {
      shopId: config.shopId,
      groupsCount: config.groups?.length,
      excludedProductsCount: config.excludedProducts?.length,
      excludedProducts: config.excludedProducts
    });
    
    res.json({
      success: true,
      message: 'Configuration saved successfully',
      data: config
    });
  } catch (error) {
    console.error('❌ Error saving config:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.error('❌ Validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while saving configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/group-discount/:shopId/group/:groupId
// @desc    Delete a specific group
// @access  Public
router.delete('/:shopId/group/:groupId', async (req, res) => {
  try {
    const { shopId, groupId } = req.params;
    
    if (!shopId || !groupId) {
      return res.status(400).json({
        success: false,
        message: 'Shop ID and Group ID are required'
      });
    }
    
    const config = await GroupDiscount.findOneAndUpdate(
      { shopId: shopId.trim() },
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
        message: 'Configuration not found for this shop'
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
      message: 'Server error while deleting group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// --------------------------------------------
// NEW ROUTE: SYNC → Update Shopify Metafield
// --------------------------------------------
router.post('/sync', async (req, res) => {
  console.log("🟦 /api/group-discount/sync HIT");

  try {
    const token = req.query.token;
    const payload = req.body;

    console.log("🔑 Token from URL:", token ? "RECEIVED" : "MISSING");
    console.log("📦 Payload received:", JSON.stringify(payload, null, 2));

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Missing admin API access token in query params"
      });
    }

    const { shopId, groups, excludedProducts } = payload;

    console.log("🏬 shopId:", shopId);
    console.log("📊 groups:", groups?.length);
    console.log("🚫 excludedProducts:", excludedProducts?.length);

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "shopId missing in payload"
      });
    }

    // --------------------------------------------
    // 1. Build the metafield value
    // --------------------------------------------
    const metafieldValue = JSON.stringify({
      groups,
      excludedProducts
    });

    console.log("🧩 Metafield JSON:", metafieldValue);

    // --------------------------------------------
    // 2. Make Shopify Admin API GraphQL Mutation
    // --------------------------------------------
    const mutationQuery = `
      mutation updateMetafield($ownerId: ID!, $namespace: String!, $key: String!, $value: String!) {
        metafieldsSet(metafields: [
          {
            ownerId: $ownerId,
            namespace: $namespace,
            key: $key,
            type: "json",
            value: $value
          }
        ]) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    console.log("📡 Sending Admin API mutation...");

    const shopDomain = shopId; // Example: "mystore.myshopify.com"

    const adminResp = await fetch(`https://${shopDomain}/admin/api/2024-04/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token
      },
      body: JSON.stringify({
        query: mutationQuery,
        variables: {
          ownerId: `gid://shopify/Shop/${shopDomain}`, // OR use shop.graphqlAdminApiId if needed
          namespace: "custom",
          key: "discountconfigdata",
          value: metafieldValue
        }
      })
    });

    const adminJson = await adminResp.json();

    console.log("🛠 Admin API Result:", JSON.stringify(adminJson, null, 2));

    if (adminJson?.errors) {
      console.log("❌ Admin API top-level errors:", adminJson.errors);
      return res.status(500).json({
        success: false,
        message: "Admin API returned errors",
        errors: adminJson.errors
      });
    }

    const userErrors = adminJson?.data?.metafieldsSet?.userErrors;
    if (userErrors?.length) {
      console.log("❌ Admin API user errors:", userErrors);
      return res.status(400).json({
        success: false,
        message: "User errors while updating metafield",
        errors: userErrors
      });
    }

    console.log("✅ Metafield updated successfully");

    return res.json({
      success: true,
      message: "Synced to Shopify metafield successfully",
      metafield: adminJson?.data?.metafieldsSet?.metafields
    });

  } catch (error) {
    console.error("❌ SYNC ROUTE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during metafield sync",
      error: error.message
    });
  }
});


module.exports = router;