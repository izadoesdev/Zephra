import { describe, it, expect, beforeEach } from 'bun:test';
import { ReactComponentAnalyzer } from '../../libs/reactAnalyzer';

describe('React Fast Refresh', () => {
  describe('ReactComponentAnalyzer', () => {
    let analyzer: ReactComponentAnalyzer;

    beforeEach(() => {
      analyzer = new ReactComponentAnalyzer();
    });

    it('should identify function components', () => {
      const functionComponent = `
        import React from 'react';
        
        const Button = ({ onClick, children }) => {
          return <button onClick={onClick}>{children}</button>;
        };
        
        export default Button;
      `;

      const analysis = analyzer.analyzeComponent('/components/Button.tsx', functionComponent);
      expect(analysis).toBeTruthy();
      expect(analysis?.name).toBe('Button');
      expect(analysis?.isFunctionComponent).toBe(true);
      expect(analysis?.isClassComponent).toBe(false);
    });

    it('should identify class components', () => {
      const classComponent = `
        import React, { Component } from 'react';
        
        class Counter extends Component {
          constructor(props) {
            super(props);
            this.state = { count: 0 };
          }
          
          render() {
            return <div>{this.state.count}</div>;
          }
        }
        
        export default Counter;
      `;

      const analysis = analyzer.analyzeComponent('/components/Counter.tsx', classComponent);
      expect(analysis).toBeTruthy();
      expect(analysis?.name).toBe('Counter');
      expect(analysis?.isClassComponent).toBe(true);
      expect(analysis?.isFunctionComponent).toBe(false);
      expect(analysis?.hasState).toBe(true);
    });

    it('should detect hooks in function components', () => {
      const componentWithHooks = `
        import React, { useState, useEffect } from 'react';
        
        const UserProfile = ({ userId }) => {
          const [user, setUser] = useState(null);
          const [loading, setLoading] = useState(true);
          
          useEffect(() => {
            fetchUser(userId).then(setUser);
          }, [userId]);
          
          return <div>{user?.name}</div>;
        };
        
        export default UserProfile;
      `;

      const analysis = analyzer.analyzeComponent('/components/UserProfile.tsx', componentWithHooks);
      expect(analysis).toBeTruthy();
      expect(analysis?.hasHooks).toBe(true);
      expect(analysis?.hasState).toBe(true);
    });

    it('should detect stateless function components', () => {
      const statelessComponent = `
        import React from 'react';
        
        const Header = ({ title, subtitle }) => {
          return (
            <header>
              <h1>{title}</h1>
              <h2>{subtitle}</h2>
            </header>
          );
        };
        
        export default Header;
      `;

      const analysis = analyzer.analyzeComponent('/components/Header.tsx', statelessComponent);
      expect(analysis).toBeTruthy();
      expect(analysis?.hasHooks).toBe(false);
      expect(analysis?.hasState).toBe(false);
      expect(analysis?.isFunctionComponent).toBe(true);
    });

    it('should extract dependencies from imports', () => {
      const componentWithDeps = `
        import React from 'react';
        import { Button } from './Button';
        import { Modal } from '../Modal';
        import { api } from '../../utils/api';
        import lodash from 'lodash';
        
        const Dialog = () => {
          return (
            <Modal>
              <Button>Close</Button>
            </Modal>
          );
        };
        
        export default Dialog;
      `;

      const analysis = analyzer.analyzeComponent('/components/Dialog.tsx', componentWithDeps);
      expect(analysis).toBeTruthy();
      expect(analysis?.dependencies).toContain('./Button');
      expect(analysis?.dependencies).toContain('../Modal');
      expect(analysis?.dependencies).toContain('../../utils/api');
      // Should not include external packages
      expect(analysis?.dependencies).not.toContain('lodash');
    });

    it('should determine Fast Refresh compatibility', () => {
      const compatibleComponent = {
        name: 'Button',
        filePath: '/components/Button.tsx',
        hasHooks: false,
        hasState: false,
        isClassComponent: false,
        isFunctionComponent: true,
        dependencies: []
      };

      const incompatibleComponent = {
        name: 'NotAComponent',
        filePath: '/utils/helper.ts',
        hasHooks: false,
        hasState: false,
        isClassComponent: false,
        isFunctionComponent: false,
        dependencies: []
      };

      expect(analyzer.canFastRefresh(compatibleComponent)).toBe(true);
      expect(analyzer.canFastRefresh(incompatibleComponent)).toBe(false);
    });

    it('should identify React files correctly', () => {
      const reactComponent = `
        import React from 'react';
        const App = () => <div>Hello</div>;
        export default App;
      `;

      const nonReactFile = `
        export const utils = {
          add: (a, b) => a + b
        };
      `;

      expect(analyzer.isReactFile('/App.tsx', reactComponent)).toBe(true);
      expect(analyzer.isReactFile('/utils.ts', nonReactFile)).toBe(false);
    });

    it('should extract component signatures for change detection', () => {
      const componentWithHooks = `
        const Component = ({ name, age }) => {
          const [count, setCount] = useState(0);
          const [data, setData] = useState(null);
          useEffect(() => {}, []);
          
          return <div>{name}</div>;
        };
      `;

      const signature = analyzer.extractComponentSignature(componentWithHooks);
      expect(signature).toContain('useState');
      expect(signature).toContain('useEffect');
    });

    it('should handle malformed components gracefully', () => {
      const malformedComponent = `
        this is not valid javascript
        const = () => {
      `;

      const analysis = analyzer.analyzeComponent('/broken.tsx', malformedComponent);
      expect(analysis).toBeNull();
    });

    it('should extract component names from various patterns', () => {
      const patterns = [
        {
          code: 'export default function MyComponent() { return <div />; }',
          expected: 'MyComponent'
        },
        {
          code: 'const MyComponent = () => <div />; export default MyComponent;',
          expected: 'MyComponent'
        },
        {
          code: 'function MyComponent() { return <div />; }',
          expected: 'MyComponent'
        }
      ];

      patterns.forEach(({ code, expected }) => {
        const analysis = analyzer.analyzeComponent('/Component.tsx', code);
        expect(analysis?.name).toBe(expected);
      });
    });
  });
}); 