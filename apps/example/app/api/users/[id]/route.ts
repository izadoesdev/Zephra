/**
 * Example dynamic API endpoint to demonstrate parameter extraction
 */
export default (context) => {
  const userId = context.params.id;
  
  return {
    message: `User details for ID: ${userId}`,
    timestamp: new Date().toISOString(),
    user: {
      id: userId,
      name: `User ${userId}`,
      createdAt: new Date().toISOString()
    }
  };
}; 