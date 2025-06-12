// dtsBundlePlugin.js
import { generateDtsBundle } from 'dts-bundle-generator';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export function dtsBundlePlugin(options = {}) {
  // const { type, entry, outFile, noCheck, preferredConfigPath } = options;
  const {
    type,
    entry = './types/index.d.ts', // TS原始碼入口(或已產生的.d.ts) // './src/index.ts'
    outFile = './dist/index.d.ts', // 輸出合併後的檔案
    noCheck = false, // 是否跳過型別檢查
    preferredConfigPath = './tsconfig.json', // 若你有自訂 tsconfig.json 路徑
  } = options;
  const name = type ? `${type}-dts-bundle-plugin` : 'dts-bundle-plugin';
  const dtsBundleGenerator = async () => {
    try {
      execSync(`tsc --noEmit --skipLibCheck`, {
        stdio: 'inherit',
      });
      console.log(`[${name}] TypeScript check passed.`);
      execSync(`tsc -p ./tsconfig.build.json --emitDeclarationOnly`, {
        stdio: 'inherit',
      });
      console.log(`[${name}] TypeScript emitDeclarationOnly.`);

      // 調用 dts-bundle-generator
      const [generatedDts] = generateDtsBundle(
        [
          {
            filePath: entry,
            noCheck, // 是否跳過型別檢查
          },
        ],
        {
          preferredConfigPath, // 例如 './tsconfig.json'
          // 也可以設定輸出風格, banner, sortNodes, 等等
        },
      );

      // 確保 dist 資料夾存在
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      // 寫入檔案
      fs.writeFileSync(outFile, generatedDts, 'utf-8');

      console.log(`[${name}] Wrote d.ts to: ${outFile}`);
    } catch (err) {
      console.error(`[${name}] Failed to generate d.ts:`, err);
    }
  };
  switch (type) {
    case 'rollup':
      return {
        name,
        writeBundle() {
          dtsBundleGenerator();
        },
      };
    case 'esbuild':
      return {
        name,
        setup(build) {
          if (build.errors && build.errors.length) {
            // 如果 esbuild 在編譯JS時就出錯, 視情況要不要繼續生成 dts
            console.log(`[dts-bundle-plugin] Skipped because esbuild build has errors.`);
            return;
          }

          console.log(`[dts-bundle-plugin] Generating d.ts from: ${entry}`);
          build.onEnd(() => dtsBundleGenerator());
        },
      };
    default:
      return dtsBundleGenerator();
  }
}

export const esbuildDtsBundlePlugin = (options = {}) =>
  dtsBundlePlugin({
    ...options,
    type: 'esbuild',
  });
