// esbuild.lib.js
import esbuild from 'esbuild';
import { esbuildCopyPackageJsonPlugin } from './scripts/copyPackageJsonPlugin.mjs';
import { esbuildDtsBundlePlugin } from './scripts/dtsBundlePlugin.mjs';
import path from 'path';
import fs from 'fs';

const distDir = 'dist';
const inputFile = 'src/index.ts';

// 讀取 root package.json，標記 external
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const externalDeps = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const sharedConfig = {
  entryPoints: [inputFile],
  bundle: true,
  platform: 'neutral', // library 通常 neutral, 或 browser/node 看需求
  sourcemap: true, // 是否需要 sourcemap
  external: externalDeps, // 不要把相依套件打包進來
  tsconfig: './tsconfig.esbuild.json', // 使用 tsconfig.json 設定
  // minify: true,       // 需壓縮可開啟
  // external: ['lodash','react'], // 若有外部依賴不想打進lib可外部化
};

async function buildLib() {
  // 1) ESM 輸出
  const esmContext = esbuild.context({
    ...sharedConfig,
    outfile: path.join(distDir, 'index.mjs'),
    format: 'esm',
    // target: ['es2020'],
    plugins: [esbuildCopyPackageJsonPlugin({ distDir }), esbuildDtsBundlePlugin()],
  });
  (await esmContext).watch();

  // 2) CJS 輸出
  const cjsContext = esbuild.context({
    ...sharedConfig,
    outfile: path.join(distDir, 'index.cjs'),
    format: 'cjs',
    // target: ['node14'],
  });
  (await cjsContext).watch();
}

buildLib().catch(() => process.exit(1));
