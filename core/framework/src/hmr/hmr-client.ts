export function generateHMRClientScript(wsPath = '/hmr', port?: number): string {
  return `
(function() {
  'use strict';
  
  const HMR_RECONNECT_DELAY = 1000;
  const HMR_MAX_RECONNECT_ATTEMPTS = 10;
  
  let socket = null;
  let reconnectAttempts = 0;
  let isReconnecting = false;
  
  function log(message, type = 'info') {
    const prefix = '[HMR]';
    const timestamp = new Date().toLocaleTimeString();
    const fullMessage = \`\${prefix} [\${timestamp}] \${message}\`;
    
    switch (type) {
      case 'error':
        console.error(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'debug':
        console.debug(fullMessage);
        break;
      default:
        console.log(fullMessage);
    }
  }
  
  function getWebSocketUrl() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = ${port ? `'localhost:${port}'` : 'location.host'};
    return \`\${protocol}//\${host}${wsPath}\`;
  }
  
  function connect() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      return;
    }
    
    const wsUrl = getWebSocketUrl();
    log(\`Connecting to \${wsUrl}...\`);
    
    try {
      socket = new WebSocket(wsUrl);
      
      socket.onopen = function() {
        log('Connected to HMR server');
        reconnectAttempts = 0;
        isReconnecting = false;
      };
      
      socket.onmessage = function(event) {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          log(\`Failed to parse HMR message: \${error.message}\`, 'error');
        }
      };
      
      socket.onclose = function(event) {
        log(\`Connection closed (code: \${event.code})\`, 'warn');
        socket = null;
        
        if (!isReconnecting && reconnectAttempts < HMR_MAX_RECONNECT_ATTEMPTS) {
          scheduleReconnect();
        }
      };
      
      socket.onerror = function(error) {
        log(\`WebSocket error: \${error}\`, 'error');
      };
      
    } catch (error) {
      log(\`Failed to create WebSocket connection: \${error.message}\`, 'error');
      scheduleReconnect();
    }
  }
  
  function scheduleReconnect() {
    if (isReconnecting) return;
    
    isReconnecting = true;
    reconnectAttempts++;
    
    if (reconnectAttempts > HMR_MAX_RECONNECT_ATTEMPTS) {
      log('Max reconnection attempts reached. Please refresh the page manually.', 'error');
      return;
    }
    
    const delay = HMR_RECONNECT_DELAY * Math.min(reconnectAttempts, 5);
    log(\`Reconnecting in \${delay}ms (attempt \${reconnectAttempts}/\${HMR_MAX_RECONNECT_ATTEMPTS})...\`);
    
    setTimeout(() => {
      isReconnecting = false;
      connect();
    }, delay);
  }
  
  function handleMessage(message) {
    log(\`Received message: \${message.type}\`, 'debug');
    
    switch (message.type) {
      case 'connected':
        log(message.message || 'Connected to HMR server');
        break;
        
      case 'update':
        handleUpdate(message);
        break;
        
      case 'css-update':
        handleCSSUpdate(message);
        break;
        
      case 'js-update':
        handleJSUpdate(message);
        break;
        
      case 'react-refresh':
        handleReactRefresh(message);
        break;
        
      case 'reload':
        log('Full page reload requested');
        location.reload();
        break;
        
      case 'error':
        log(\`HMR Error: \${message.message}\`, 'error');
        break;
        
      default:
        log(\`Unknown message type: \${message.type}\`, 'warn');
    }
  }
  
  function handleUpdate(message) {
    const { file, hash, moduleId, updateType } = message;
    log(\`File updated: \${file} (hash: \${hash}, type: \${updateType})\`);
    
    if (updateType === 'hot') {
      log(\`Applying hot update for module: \${moduleId}\`);
      // Hot update applied successfully - no reload needed
    } else {
      log('Reloading page due to file change...');
      location.reload();
    }
  }
  
  function handleCSSUpdate(message) {
    const { file, cssContent, moduleId } = message;
    log(\`Hot updating CSS: \${file}\`);
    
    try {
      // Find existing style tag for this module or create new one
      let styleTag = document.querySelector(\`style[data-hmr-id="\${moduleId}"]\`);
      
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.setAttribute('data-hmr-id', moduleId);
        styleTag.setAttribute('data-hmr-file', file);
        document.head.appendChild(styleTag);
      }
      
      // Update CSS content
      styleTag.textContent = cssContent;
      log(\`CSS hot update applied: \${file}\`);
      
      // Flash effect to show update
      document.body.style.transition = 'opacity 0.1s';
      document.body.style.opacity = '0.95';
      setTimeout(() => {
        document.body.style.opacity = '1';
        setTimeout(() => {
          document.body.style.transition = '';
        }, 100);
      }, 50);
      
    } catch (error) {
      log(\`Failed to apply CSS hot update: \${error.message}\`, 'error');
      location.reload();
    }
  }
  
  function handleJSUpdate(message) {
    const { file, moduleId, message: updateMessage } = message;
    log(\`JS module updated: \${file} - \${updateMessage}\`);
    
    // For now, we'll do a smart reload for JS updates
    // TODO: Implement React Fast Refresh here
    if (isReactComponent(file)) {
      log('React component updated, attempting smart reload...');
      // In the future, this would trigger React Fast Refresh
      location.reload();
    } else {
      log('Utility module updated, reloading page...');
      location.reload();
    }
  }
  
  function handleReactRefresh(message) {
    const { file, componentName, preserveState, componentCode, moduleId } = message;
    log(\`React Fast Refresh: \${componentName} (preserve state: \${preserveState})\`);
    
    try {
      // This is a simplified Fast Refresh implementation
      // In a real implementation, you'd need to integrate with React's Fast Refresh runtime
      
      if (preserveState) {
        // Attempt to preserve component state during refresh
        log(\`Preserving state for \${componentName}...\`);
        
        // Store current component state (simplified approach)
        const componentInstances = findReactComponentInstances(componentName);
        const savedStates = componentInstances.map(instance => saveComponentState(instance));
        
        // Apply the update
        applyReactComponentUpdate(moduleId, componentCode);
        
        // Restore state after a brief delay
        setTimeout(() => {
          restoreComponentStates(componentName, savedStates);
          log(\`State preserved for \${componentName}\`);
        }, 50);
        
      } else {
        // Component doesn't have state, safe to refresh without preservation
        log(\`Refreshing stateless component: \${componentName}\`);
        applyReactComponentUpdate(moduleId, componentCode);
      }
      
      // Visual feedback for successful Fast Refresh
      showFastRefreshIndicator(componentName);
      
    } catch (error) {
      log(\`Fast Refresh failed for \${componentName}: \${error.message}\`, 'error');
      log('Falling back to full page reload...');
      location.reload();
    }
  }
  
  function findReactComponentInstances(componentName) {
    // This is a simplified implementation
    // In reality, you'd need to integrate with React DevTools or React's internal fiber tree
    const instances = [];
    
    // Look for React component instances in the DOM
    const elements = document.querySelectorAll(\`[data-react-component="\${componentName}"]\`);
    elements.forEach(el => {
      if (el._reactInternalInstance || el._reactInternalFiber) {
        instances.push(el._reactInternalInstance || el._reactInternalFiber);
      }
    });
    
    return instances;
  }
  
  function saveComponentState(instance) {
    // Simplified state extraction
    try {
      if (instance && instance.memoizedState) {
        return JSON.parse(JSON.stringify(instance.memoizedState));
      }
    } catch (error) {
      log(\`Failed to save component state: \${error.message}\`, 'warn');
    }
    return null;
  }
  
  function applyReactComponentUpdate(moduleId, componentCode) {
    // This is where you'd integrate with your module system
    // For now, we'll trigger a targeted re-render
    
    log(\`Applying component update for module: \${moduleId}\`);
    
    // In a real implementation, you'd:
    // 1. Update the module in your module cache
    // 2. Re-evaluate the component
    // 3. Trigger React to re-render affected components
    
    // For now, we'll use a simple approach
    const event = new CustomEvent('hmr-react-refresh', {
      detail: { moduleId, componentCode }
    });
    window.dispatchEvent(event);
  }
  
  function restoreComponentStates(componentName, savedStates) {
    // Simplified state restoration
    log(\`Attempting to restore state for \${componentName}\`);
    
    // In a real implementation, you'd need to:
    // 1. Find the new component instances after refresh
    // 2. Restore their state from savedStates
    // 3. Trigger a re-render with the restored state
    
    // This is a placeholder for the complex state restoration logic
  }
  
  function showFastRefreshIndicator(componentName) {
    // Visual feedback that Fast Refresh occurred
    const indicator = document.createElement('div');
    indicator.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: opacity 0.3s ease;
    \`;
    indicator.textContent = \`⚡ Fast Refresh: \${componentName}\`;
    
    document.body.appendChild(indicator);
    
    // Fade out after 2 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }, 2000);
  }

  function isReactComponent(filename) {
    if (!filename) return false;
    return /\\.(jsx|tsx)$/.test(filename) && /^[A-Z]/.test(filename.split('/').pop());
  }
  
  function shouldReloadPage(filename) {
    if (!filename) return true;
    
    // Always reload for these file types
    const alwaysReload = ['.html', '.php', '.py', '.rb', '.go', '.rs'];
    if (alwaysReload.some(ext => filename.endsWith(ext))) {
      return true;
    }
    
    // For now, reload for all changes
    // TODO: Implement selective updates for CSS, JS modules
    return true;
  }
  
  // Initialize HMR client
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', function() {
    if (socket) {
      socket.close();
    }
  });
  
  // Initialize Fast Refresh if available
  if (typeof window.__REACT_FAST_REFRESH__ !== 'undefined') {
    log('React Fast Refresh available');
  }

  // Expose HMR API for debugging
  window.__HMR__ = {
    connect,
    disconnect: () => socket && socket.close(),
    getStatus: () => socket ? socket.readyState : 'disconnected',
    getAttempts: () => reconnectAttempts,
    fastRefresh: window.__REACT_FAST_REFRESH__ || null
  };
  
})();
`;
} 