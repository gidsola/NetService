import esbuild from 'esbuild';
import cssModulesPlugin from 'esbuild-css-modules-plugin';
import { glob } from 'glob';
import ReactRoute from './react-route.js';
import path from 'path';
const entryPoints = await glob(['app/**/*.{tsx,jsx}']);
const BaseBuildOptions = {
    entryPoints: entryPoints,
    outdir: '.react/',
    platform: 'node',
    format: 'esm',
    target: 'esnext',
    loader: { '.tsx': 'tsx', '.jsx': 'jsx' },
    plugins: [cssModulesPlugin({ inject: true, localsConvention: 'camelCase' })],
    jsx: 'automatic',
    preserveSymlinks: true
};
/**
 *
 */
export default class ReactCustomServer {
    ReactRoute;
    ReactRequestHandler;
    /**
     *
     * @param development
     */
    constructor(development) {
        this.ReactRoute = new ReactRoute();
        this.ReactRequestHandler = this.ReactRoute.router.bind(this.ReactRoute);
        // not staying
        if (development) {
            this.devBuild();
        }
        else {
            this.prodBuild();
        }
        ;
    }
    /**
     *
     */
    async devBuild() {
        try {
            const ctx = await esbuild.context({ ...BaseBuildOptions, sourcemap: 'inline' });
            await ctx.watch();
            console.log('Watching for changes...');
            await this.mapRoutes(entryPoints);
        }
        catch (e) {
            console.error('Error in devBuild:', e);
        }
        ;
    }
    ;
    /**
     *
     */
    async prodBuild() {
        // todo: handle build failures
        await esbuild.build({ ...BaseBuildOptions });
        await esbuild.build({
            entryPoints: ['src/main.tsx'],
            bundle: true,
            outfile: 'public/main.js',
            platform: 'browser',
            target: 'es2015',
            loader: { '.tsx': 'tsx', '.jsx': 'jsx' },
            jsx: 'automatic'
        });
        await this.mapRoutes(entryPoints);
    }
    ;
    /**
     *
     * @param entryPoints
     */
    async mapRoutes(entryPoints) {
        try {
            for (const entryPoint of entryPoints) {
                const relativePath = path.relative('app', entryPoint);
                const routePath = `/${relativePath.replace(/\.(tsx|jsx)$/, '').replace(/\\/g, '/')}`;
                // const componentPath = path.join('.react', relativePath.replace(/\.(tsx|jsx)$/, '') + '.js')
                //   .replace(/\\/g, '/');
                const componentPath = path.resolve(process.cwd(), '.react', relativePath.replace(/\.(tsx|jsx)$/, '') + '.js');
                console.log("componentPath", componentPath);
                const fileUrl = new URL(`file://${componentPath.replace(/\\/g, '/')}`);
                console.log("fileUrl", fileUrl.href);
                const componentModule = await import(fileUrl.href);
                // const componentModule = await import(componentPath);
                const componentName = Object.keys(componentModule)[0];
                if (componentName) {
                    console.log("componentName", componentName);
                    const component = componentModule[componentName];
                    this.ReactRoute.use(routePath, component);
                }
                else
                    console.error("component path returned undefined");
            }
            ;
        }
        catch (e) {
            console.error(e);
        }
        ;
    }
    ;
}
;
//# sourceMappingURL=react.js.map