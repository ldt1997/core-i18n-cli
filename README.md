# core-i18n-cli

`core-i18n-cli` 是一个基于 `react-intl` 的 CLI 工具，用于自动扫描和替换指定文件夹下的中文文案，以便更轻松地进行国际化开发。

## 如何使用

```shell
npm i -g core-i18n-cli
```

## CLI 参数

### corei18n  `-i, --init`
初始化项目，生成配置文件 `corei18n.config.json`，方便根据你的项目需求进行配置。

默认配置包括以下参数：
```ts
export type ProjectConfig = {
  corei18nDir: string;
  tempLangFile: string;
  path: string;
  localLangFile?: string;
  ignoreFile?: GlobOptions["ignore"];
  idType: "translate" | "hash";
  baiduApiKey?: {
    appId: string;
    appKey: string;
  };
  idSuffix?:string;
  keepDefaultMessage?: boolean;
  prettierOptions?: Options;
};
```
详细配置说明：
```js
{
  corei18nDir: "./.corei18n", // corei18n文件根目录，用于放置提取的langs文件
  tempLangFile: "./.corei18n/tempLang.json", // 导出的新增文案目录

  path: "src/pages/**/*.{ts,js,jsx,tsx}", // 需要做国际化的文件目录
  localLangFile: "src/locales/zh-CN.ts", // 已有文案入口，用于过滤已经存在id的文案，支持js、ts、json
  ignoreFile: "src/pages/**/*.d.ts", // 忽略的文件，string | string[]，参考GlobOptions.ignore

  // 百度翻译开放平台配置，参考 https://fanyi-api.baidu.com/product/113
  baiduApiKey: {
    appId: "",
    appKey: "",
  },

  keepDefaultMessage: false, // 替换后是否保留DefaultMessage，默认为false
  idType: "translate", // 生成id的方式，translate 或者 hash，默认为translate，需要提供baiduApiKey
  idSuffix: "", // 生成id前缀，会以.拼接在id前面
}
```

### corei18n `-s, --scan`

一键扫描指定文件夹下的所有中文文案，新增文案会存放至`tempLangFile`

### corei18n `-r, --replace`

一键替换指定文件夹下的所有中文文案，提高国际化开发效率。
