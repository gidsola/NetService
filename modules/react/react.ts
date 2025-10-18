
import type { IncomingMessage, ServerResponse } from 'http';
import esbuild from 'esbuild';
import cssModulesPlugin from 'esbuild-css-modules-plugin';
import { glob } from 'glob';
import ReactRoute from './react-route.js';
import path from 'path';

const entryPoints = await glob(['app/**/*.{tsx,jsx}']);
const BaseBuildOptions: esbuild.BuildOptions = {
  entryPoints: entryPoints,
  outdir: '.react/',
  platform: 'node',
  format: 'esm',
  target: 'esnext',
  loader: { '.tsx': 'tsx', '.jsx': 'jsx' },
  plugins: [cssModulesPlugin({ inject: true, localsConvention: 'camelCase' })],
  jsx: 'automatic'

};

/**
 * 
 */
export type ReactCustom = {
  ReactRoute: ReactRoute;
  ReactRequestHandler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
};

/**
 * 
 */
export default class ReactCustomServer {

  public ReactRoute: ReactRoute;
  public ReactRequestHandler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;

  /**
   * 
   * @param development 
   */
  constructor(development: boolean) {

    this.ReactRoute = new ReactRoute();
    this.ReactRequestHandler = this.ReactRoute.router.bind(this.ReactRoute)

    // not staying
    if (development) {
      this.devBuild();
    }
    else {
      this.prodBuild();
    };

  }


  /**
   * 
   */
  private async devBuild(): Promise<void> {
    try {

      const ctx = await esbuild.context({ ...BaseBuildOptions, sourcemap: 'inline' });
      await ctx.watch();
      console.log('Watching for changes...');

      await this.mapRoutes(entryPoints);

    } catch (e) {
      console.error('Error in devBuild:', e);
    };
  };

  /**
   * 
   */
  private async prodBuild(): Promise<void> {

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

  };

  /**
   * 
   * @param entryPoints 
   */
  private async mapRoutes(entryPoints: string[]): Promise<void> {
    try {
      for (const entryPoint of entryPoints) {
        console.log("entryPoint", entryPoint);

        const relativePath = path.relative('app', entryPoint);
        console.log("relativePath", relativePath);

        const routePath = `/${relativePath.replace(/\.(tsx|jsx)$/, '').replace(/\\/g, '/')}`;
        console.log("routePath", routePath);

        const componentPath = path.join('.react', `${relativePath.replace(/\.(tsx|jsx)$/, '')}.js`);
        console.log("componentPath", componentPath);

        const componentModule = await import(componentPath);
        console.log("componentModule", componentModule);

        const componentName = Object.keys(componentModule)[0];
        if (componentName) {
          console.log("componentName", componentName);
          const component = componentModule[componentName!];
          this.ReactRoute.use(routePath, component);
        }
        else console.error("component path returned undefined");
      };
    }
    catch (e) {
      console.error(e);
    };
  };

};
