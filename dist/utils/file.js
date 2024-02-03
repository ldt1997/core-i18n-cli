import { PROJECT_CONFIG, I18N_CONFIG_FILE, LOCAL_LANG_DIR, } from "../const.js";
import path from "path";
import fs from "fs";
import ts from "typescript";
import pify from "pify";
/**
 * @description 获得项目配置信息
 */
export function getProjectConfig() {
    const configFile = path.resolve(process.cwd(), `./${I18N_CONFIG_FILE}`);
    let obj = PROJECT_CONFIG;
    if (configFile && fs.existsSync(configFile)) {
        obj = {
            ...obj,
            ...JSON.parse(fs.readFileSync(configFile, "utf8")),
        };
    }
    return obj;
}
/**
 * @description 解析ts到指定目录下
 * @param dirPath
 * @param outDir
 * @returns
 */
export async function compileTypeScript(dirPath, outDir) {
    return new Promise((resolve, reject) => {
        const compilerOptions = {
            target: ts.ScriptTarget.ES2015,
            module: ts.ModuleKind.CommonJS,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            outDir,
        };
        const program = ts.createProgram([dirPath], compilerOptions);
        ts.createCompilerHost(compilerOptions);
        const emitResult = program.emit();
        if (emitResult.emitSkipped) {
            reject(new Error("Compilation failed"));
        }
        else {
            resolve();
        }
    });
}
/**
 * @description 获取转换完成的本地文案入口文件
 * @param config
 * @returns e.g. src/locales/zh-CN.ts -> .corei18n/localLang/zh-CN.js
 */
export function getCorei18nLocalLangPath(config) {
    const fileName = path.basename(config.localLangFile, path.extname(config.localLangFile));
    return path.resolve(process.cwd(), `${config.corei18nDir}/${LOCAL_LANG_DIR}/${fileName}.js`);
}
/**
 * @description 根据本地locale文件入口获取已有文案
 * @param config
 */
export async function getLocalLangMap(config) {
    const localLangFilePath = path.resolve(process.cwd(), config.localLangFile);
    const fileExtension = path.extname(localLangFilePath);
    if (fs.existsSync(localLangFilePath)) {
        if (fileExtension === ".js") {
            const res = await import(localLangFilePath).then((res) => res?.default?.default);
            return res;
        }
        if (fileExtension === ".json") {
            // @ts-ignore
            const json = await pify(fs.readFile)(localLangFilePath, "utf-8");
            // @ts-ignore
            return JSON.parse(json);
        }
        if (fileExtension === ".ts") {
            const corei18nLocalLangPath = getCorei18nLocalLangPath(config);
            if (fs.existsSync(corei18nLocalLangPath)) {
                const res = await import(corei18nLocalLangPath).then((res) => res?.default?.default);
                return res;
            }
            const outDir = path.resolve(process.cwd(), `${config.corei18nDir}/${LOCAL_LANG_DIR}`);
            await compileTypeScript(localLangFilePath, outDir);
            const res = await import(corei18nLocalLangPath).then((res) => res?.default?.default);
            return res;
        }
    }
    return {};
}
/**
 * @description 删除生成的临时文件夹
 * @param config
 */
export async function removeTempDir() {
    const config = getProjectConfig();
    const corei18nLocalLangPath = getCorei18nLocalLangPath(config);
    if (fs.existsSync(corei18nLocalLangPath)) {
        fs.rmdir(path.resolve(process.cwd(), `${config.corei18nDir}/${LOCAL_LANG_DIR}`), { recursive: true }, (err) => {
            if (err) {
                console.error(`\n删除临时文件夹 ${LOCAL_LANG_DIR} 失败:`, err);
            }
        });
    }
}
//# sourceMappingURL=file.js.map