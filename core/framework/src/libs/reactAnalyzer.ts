import { createLogger } from './logger';
import type { ReactComponentInfo } from '../types/hmr';
import { basename } from 'path';

const logger = createLogger('hmr:react-analyzer');

export class ReactComponentAnalyzer {
  
  analyzeComponent(filePath: string, content: string): ReactComponentInfo | null {
    try {
      const fileName = basename(filePath);
      const componentName = this.extractComponentName(fileName, content);
      
      if (!componentName) {
        return null;
      }

      const analysis: ReactComponentInfo = {
        name: componentName,
        filePath,
        hasHooks: this.detectHooks(content),
        hasState: this.detectState(content),
        isClassComponent: this.isClassComponent(content),
        isFunctionComponent: this.isFunctionComponent(content),
        dependencies: this.extractDependencies(content)
      };

      logger.debug(`Analyzed React component: ${componentName}`, analysis);
      return analysis;
    } catch (error) {
      logger.error(`Failed to analyze React component ${filePath}:`, error);
      return null;
    }
  }

  canFastRefresh(componentInfo: ReactComponentInfo): boolean {
    // Fast Refresh requirements:
    // 1. Must be a React component (function or class)
    // 2. Should not have complex side effects in render
    // 3. Should export the component as default or named export
    
    if (!componentInfo.isFunctionComponent && !componentInfo.isClassComponent) {
      return false;
    }

    // Function components with hooks are generally safe for Fast Refresh
    if (componentInfo.isFunctionComponent) {
      return true;
    }

    // Class components can use Fast Refresh but with limitations
    if (componentInfo.isClassComponent) {
      // Avoid Fast Refresh for class components with complex lifecycle methods
      return !this.hasComplexLifecycleMethods(componentInfo.filePath);
    }

    return false;
  }

  private extractComponentName(fileName: string, content: string): string | null {
    // Try to extract component name from file name first
    const fileBaseName = fileName.replace(/\.(tsx|jsx|ts|js)$/, '');
    
    // Check if it's a valid React component name (starts with uppercase)
    if (/^[A-Z][a-zA-Z0-9]*$/.test(fileBaseName)) {
      return fileBaseName;
    }

    // Try to extract from export statements
    const exportMatches = [
      // export default function ComponentName
      /export\s+default\s+function\s+([A-Z][a-zA-Z0-9]*)/,
      // export default ComponentName
      /export\s+default\s+([A-Z][a-zA-Z0-9]*)/,
      // const ComponentName = () => {}; export default ComponentName
      /const\s+([A-Z][a-zA-Z0-9]*)\s*=.*export\s+default\s+\1/s,
      // function ComponentName() {}
      /function\s+([A-Z][a-zA-Z0-9]*)\s*\(/,
      // const ComponentName = 
      /const\s+([A-Z][a-zA-Z0-9]*)\s*=/
    ];

    for (const regex of exportMatches) {
      const match = content.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  private detectHooks(content: string): boolean {
    const hookPatterns = [
      /use[A-Z][a-zA-Z0-9]*\s*\(/,  // useState, useEffect, etc.
      /React\.use[A-Z][a-zA-Z0-9]*\s*\(/,  // React.useState, etc.
    ];

    return hookPatterns.some(pattern => pattern.test(content));
  }

  private detectState(content: string): boolean {
    const statePatterns = [
      /useState\s*\(/,
      /useReducer\s*\(/,
      /this\.state\s*=/,
      /this\.setState\s*\(/,
      /state\s*:\s*{/
    ];

    return statePatterns.some(pattern => pattern.test(content));
  }

  private isFunctionComponent(content: string): boolean {
    const functionPatterns = [
      // Arrow function components
      /const\s+[A-Z][a-zA-Z0-9]*\s*=\s*\([^)]*\)\s*=>/,
      // Function declaration components
      /function\s+[A-Z][a-zA-Z0-9]*\s*\([^)]*\)/,
      // Export default function
      /export\s+default\s+function\s+[A-Z][a-zA-Z0-9]*\s*\(/
    ];

    return functionPatterns.some(pattern => pattern.test(content)) &&
           content.includes('return') &&
           (content.includes('jsx') || content.includes('<') || content.includes('React.createElement'));
  }

  private isClassComponent(content: string): boolean {
    const classPatterns = [
      /class\s+[A-Z][a-zA-Z0-9]*\s+extends\s+React\.Component/,
      /class\s+[A-Z][a-zA-Z0-9]*\s+extends\s+Component/,
      /class\s+[A-Z][a-zA-Z0-9]*\s+extends\s+React\.PureComponent/,
      /class\s+[A-Z][a-zA-Z0-9]*\s+extends\s+PureComponent/
    ];

    return classPatterns.some(pattern => pattern.test(content));
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract import statements
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      // Only include relative imports (local dependencies)
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        dependencies.push(importPath);
      }
    }

    return dependencies;
  }

  private hasComplexLifecycleMethods(filePath: string): boolean {
    // This is a simplified check - in a real implementation,
    // you'd want to parse the AST to detect complex lifecycle methods
    // For now, we'll be conservative and assume class components are safe
    return false;
  }

  isReactFile(filePath: string, content: string): boolean {
    const hasReactImport = /import.*React.*from\s+['"]react['"]/.test(content);
    const hasJSX = /<[A-Z][a-zA-Z0-9]*/.test(content) || /React\.createElement/.test(content);
    const isComponentFile = /\.(jsx|tsx)$/.test(filePath);
    
    return hasReactImport || hasJSX || isComponentFile;
  }

  extractComponentSignature(content: string): string {
    // Extract a signature that helps determine if the component structure changed
    // This is used to decide if Fast Refresh can preserve state
    
    const signatures: string[] = [];
    
    // Extract hook calls (order matters for React)
    const hookMatches = content.match(/use[A-Z][a-zA-Z0-9]*\s*\([^)]*\)/g);
    if (hookMatches) {
      signatures.push(...hookMatches);
    }
    
    // Extract prop destructuring
    const propMatches = content.match(/\(\s*{\s*([^}]+)\s*}\s*\)/);
    if (propMatches) {
      signatures.push(propMatches[1]);
    }
    
    return signatures.join('|');
  }
} 