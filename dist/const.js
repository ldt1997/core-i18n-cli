/**
 * @desc 项目配置文件配置信息
 */
export const I18N_CONFIG_FILE = "corei18n.config.json";
export const LOCAL_LANG_DIR = "localLang";
export const PROJECT_CONFIG = {
    corei18nDir: "./.corei18n", // corei18n文件根目录，用于放置提取的langs文件
    tempLangFile: "./.corei18n/tempLang.json", // 导出的新增文案目录
    path: "src/pages/**/*.{ts,js,jsx,tsx}", // 需要做国际化的文件目录
    localLangFile: "src/locales/zh-CN.ts", // 已有文案入口，用于过滤已经存在id的文案，支持js、ts、json
    ignoreFile: "src/pages/**/*.d.ts", // 忽略的文件 string | string[]，参考GlobOptions.ignore
    // baiduApiKey
    baiduApiKey: {
        appId: "",
        appKey: "",
    },
    keepDefaultMessage: false, // 替换后是否保留DefaultMessage，默认为false
    idType: "translate", // 生成id的方式 translate 或者 hash，默认为translate，需要提供baiduApiKey
    idSuffix: "", // 生成id前缀，会以.拼接在id前面
    prettierOptions: {
        parser: "typescript",
        printWidth: 120,
        tabWidth: 2,
        useTabs: false,
        singleQuote: true,
        jsxSingleQuote: true,
        semi: false,
        trailingComma: "all",
        bracketSpacing: true,
        jsxBracketSameLine: false,
    },
};
//# sourceMappingURL=const.js.map