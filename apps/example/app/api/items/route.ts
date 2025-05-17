/**
 * Example API endpoint for items with multiple methods
 */

/**
 * GET handler to retrieve items
 */
export const get = (context) => {
  return {
    message: 'Items fetched successfully',
    timestamp: new Date().toISOString(),
    items: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ]
  };
};

/**
 * POST handler to create a new item
 */
export const post = async (context) => {
  try {
    // Attempt to parse the request body
    const item = await context.body;
    
    return {
      message: 'Item created successfully',
      timestamp: new Date().toISOString(),
      item: {
        ...item,
        id: Math.floor(Math.random() * 1000),
        createdAt: new Date().toISOString()
      }
    };
  } catch (err) {
    context.set.status = 400;
    return {
      error: 'Invalid item data',
      message: 'Please provide a valid item payload'
    };
  }
}; 