// tsdown config (plain JS — no TS type-stripping or `unrun` loader needed,
// so the client bundle builds on any Node >= 18).
const packageId = 'dsh-text2img-compress'
const externals = ['react']

export default {
  entry: { client: 'src/ui/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  external: externals,
  noExternal: (id) => externals.includes(id) ? undefined : true,
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(packageId)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}
