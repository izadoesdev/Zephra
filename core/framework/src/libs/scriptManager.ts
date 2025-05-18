import { hmrScript } from '../scripts/hmr';

const defaultScripts: string[] = [];
if (process.env.NODE_ENV !== 'production') {
  defaultScripts.push(hmrScript);
}

class ScriptManager {
  private scripts: string[] = [];

  add(script: string) {
    this.scripts.push(script);
  }

  remove(script: string) {
    this.scripts = this.scripts.filter(s => s !== script);
  }

  clear() {
    this.scripts = [];
  }

  getAll(): string[] {
    return Array.from(new Set([...defaultScripts, ...this.scripts]));
  }

  injectScripts(html: string, scripts: string[]): string {
    if (!scripts.length) return html;
    const scriptsHtml = scripts.join('');
    if (html.includes('</body>')) {
      return html.replace('</body>', `${scriptsHtml}</body>`);
    }
    return html + scriptsHtml;
  }
}

export const scriptManager = new ScriptManager();
export const injectScripts = scriptManager.injectScripts.bind(scriptManager); 