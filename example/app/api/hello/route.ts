/**
 * Example API endpoint to demonstrate file-based routing
 */
export default (context) => {
  return {
    message: 'Hello from Zephra API!',
    timestamp: new Date().toISOString(),
    query: context.query,
    path: context.path
  };
}; 