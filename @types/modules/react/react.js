import esbuild, {} from 'esbuild';
import CssModulesPlugin from 'esbuild-css-modules-plugin';
import { glob } from 'glob';
import ReactRoute from './react-route.js';
import path from 'path';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';
const configPath = path.resolve(process.cwd(), 'netservice.config.js');
let netserviceConfig = {
    reactBasePath: 'app',
    bundle: false,
    outdir: '.dist/',
    inject: [],
    loader: { '.tsx': 'tsx', '.jsx': 'jsx', '.css': 'text' }
};
if (existsSync(configPath)) {
    const configModule = await import(pathToFileURL(configPath).href);
    netserviceConfig = { ...netserviceConfig, ...configModule.default };
}
const basePath = netserviceConfig.reactBasePath || 'app';
const entryPoints = await glob([`${basePath}/**/*.{tsx,jsx}`]);
const BaseBuildOptions = {
    entryPoints: entryPoints,
    outdir: netserviceConfig.outdir,
    bundle: netserviceConfig.bundle,
    platform: 'browser',
    format: 'esm',
    target: ['chrome80', 'edge80', 'firefox78', 'safari14'],
    jsx: 'automatic',
    preserveSymlinks: true,
    inject: netserviceConfig.inject,
    loader: netserviceConfig.loader,
    plugins: [CssModulesPlugin({ localsConvention: 'camelCase' })]
};
/**
 * Only provide the ReactRoute instance and handler.
 * Do not import or execute React components in Node.js.
 */
export default class ReactCustomServer {
    ReactRoute;
    ReactRequestHandler;
    constructor(development) {
        this.ReactRoute = new ReactRoute();
        this.ReactRequestHandler = this.ReactRoute.router.bind(this.ReactRoute);
        if (development) {
            this.devBuild();
        }
        else {
            this.prodBuild();
        }
    }
    async devBuild() {
        try {
            const ctx = await esbuild.context({ ...BaseBuildOptions, sourcemap: 'inline' });
            await ctx.watch();
            console.log('Watching for changes...');
        }
        catch (e) {
            console.error('Error in devBuild:', e);
        }
    }
    async prodBuild() {
        try {
            await esbuild.build({ ...BaseBuildOptions });
            await esbuild.build({
                entryPoints: ['src/main.tsx'],
                bundle: true,
                outfile: 'public/main.js',
                platform: 'browser',
                target: ['chrome80', 'edge80', 'firefox78', 'safari14'],
                loader: { '.tsx': 'tsx', '.jsx': 'jsx', '.css': 'text' },
                jsx: 'automatic'
            });
        }
        catch (e) {
            console.error('Error in prodBuild:', e);
        }
    }
}
//# sourceMappingURL=react.js.map