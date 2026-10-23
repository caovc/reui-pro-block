import { zipSync, strToU8 } from 'fflate';
import type { TemplateMeta } from './catalog';

const sources = import.meta.glob([
  '/src/templates/{business,workflow,collaboration}/**/*.{ts,tsx,css}',
  '/src/templates/{surface.tsx,reference.css}',
  '/src/blocks/**/*.{ts,tsx,css}',
  '/src/components/ui/*.{ts,tsx}',
  '/src/components/reui/**/*.{ts,tsx,css}',
  '/src/hooks/**/*.{ts,tsx}',
  '/src/lib/{utils,download}.ts',
  '/src/data/*.{ts,json}',
  '/src/index.css', '/src/styles/shadcn.css',
], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const assets = import.meta.glob('/src/**/*.{jpg,jpeg,png,webp,svg,woff,woff2}', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const meta = import.meta.glob(['/package.json', '/LICENSE', '/THIRD_PARTY_NOTICES.md', '/src/blocks/assets/Inter-LICENSE.txt', '/src/templates/**/assets/*.{txt,md}', '/src/components/reui/*.{md,txt}', '/docs/*provenance*.md'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function normalize(path: string) {
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (part === '..') parts.pop();
    else if (part !== '.') parts.push(part);
  }
  return parts.join('/');
}
function collect(template: TemplateMeta) {
  const files: Record<string, string> = {};
  const requiredAssets = new Set<string>();
  function visit(path: string) {
    if (assets[path]) { requiredAssets.add(path); return; }
    const resolved = [path, `${path}.tsx`, `${path}.ts`, `${path}.css`, `${path}/index.tsx`].find(name => sources[name] !== undefined);
    if (!resolved || files[resolved.slice(1)]) return;
    files[resolved.slice(1)] = sources[resolved];
    const imports = /(?:from\s*|import\s*\(?\s*|url\(\s*)['"]([^'"]+)['"]/g;
    for (const match of sources[resolved].matchAll(imports)) {
      const target = match[1];
      if (target.startsWith('@/')) visit(`/src/${target.slice(2)}`);
      else if (target.startsWith('.')) visit(normalize(`${resolved.slice(0, resolved.lastIndexOf('/'))}/${target}`));
    }
  }
  visit(`/src/templates/${template.family}/index.tsx`);
  visit('/src/templates/surface.tsx');
  visit('/src/components/ui/tooltip.tsx');
  visit('/src/components/ui/sonner.tsx');
  files['src/Example.tsx'] = `import Template from '@/templates/${template.family}'\nimport { TemplateSurface } from '@/templates/surface'\nexport default function Example() { return <TemplateSurface id="${template.id}"><Template id="${template.id}"/></TemplateSurface> }\n`;
  files['src/blocks/assets/Inter-LICENSE.txt'] = meta['/src/blocks/assets/Inter-LICENSE.txt'];
  for (const [path, content] of Object.entries(meta)) {
    if (path.startsWith(`/src/templates/${template.family}/`) || path.startsWith('/src/components/reui/') || path.startsWith('/docs/')) files[path.slice(1)] = content;
  }
  files['src/theme.css'] = sources['/src/index.css'].split(/\n\.brand\s*\{/)[0];
  files['src/styles/shadcn.css'] = sources['/src/styles/shadcn.css'];
  return { files, requiredAssets };
}
export function templateFiles(template: TemplateMeta) { return collect(template).files; }

export async function downloadTemplate(template: TemplateMeta) {
  const { files, requiredAssets } = collect(template);
  const manifest = JSON.parse(meta['/package.json']);
  files['package.json'] = JSON.stringify({ name: `${template.id}-template`, version: '1.0.0', private: true, type: 'module', scripts: { dev: 'vite', build: 'tsc --noEmit && vite build', preview: 'vite preview' }, dependencies: manifest.dependencies, devDependencies: manifest.devDependencies }, null, 2);
  files['index.html'] = '<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>' + template.name + '</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>';
  files['src/main.tsx'] = "import { createRoot } from 'react-dom/client'\nimport { TooltipProvider } from '@/components/ui/tooltip'\nimport { Toaster } from '@/components/ui/sonner'\nimport Example from './Example'\nimport './theme.css'\ncreateRoot(document.getElementById('root')!).render(<TooltipProvider><Example/><Toaster richColors/></TooltipProvider>)\n";
  files['vite.config.ts'] = "import path from 'node:path'\nimport { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\nexport default defineConfig({plugins:[react(),tailwindcss()],resolve:{alias:{'@':path.resolve(import.meta.dirname,'./src')}}})\n";
  files['tsconfig.json'] = JSON.stringify({ compilerOptions: { target: 'ES2023', lib: ['ES2023', 'DOM', 'DOM.Iterable'], types: ['vite/client', 'node'], module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx', esModuleInterop: true, skipLibCheck: true, strict: true, paths: { '@/*': ['./src/*'] } }, include: ['src'] }, null, 2);
  files['README.md'] = `# ${template.name}\n\nIndependent React recreation of the publicly visible ${template.name} preview.\nReference: ${template.reference}\n\nRun npm install, then npm run dev (Node.js 24+). Entry: src/Example.tsx.\n\nInteractions use local demo data. No production backend, authentication, AI provider, email delivery, or original premium source is included. Shared family modules are included as transitive dependencies. Public preview photos and wallpaper screenshots remain external URL references and require an internet connection. Bundled fonts and licensed images retain their license notices; no premium source or premium media binaries are bundled.\n`;
  files['LICENSE'] = meta['/LICENSE'];
  files['THIRD_PARTY_NOTICES.md'] = meta['/THIRD_PARTY_NOTICES.md'];
  const payload = Object.fromEntries(Object.entries(files).map(([path, source]) => [path, strToU8(source)]));
  await Promise.all([...requiredAssets].map(async path => {
    const response = await fetch(assets[path]);
    if (!response.ok) throw new Error(`Unable to bundle ${path}`);
    payload[path.slice(1)] = new Uint8Array(await response.arrayBuffer());
  }));
  const url = URL.createObjectURL(new Blob([new Uint8Array(zipSync(payload)).buffer], { type: 'application/zip' }));
  const link = document.createElement('a');
  link.href = url; link.download = `${template.id}-template.zip`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
