import generator from "@babel/generator";
import parser from "@babel/parser";
import traverser from "@babel/traverse";
import _ from "lodash";
import t from "@babel/types";
import fs from "fs";
import { glob } from "glob";
import path from "path";
import pify from "pify";
import prettier from "prettier";
import {
  getProjectConfig,
  hasChinese,
  isIntlDefaultMessage,
  getLocalLangMap,
  removeTempDir,
  mkCorei18nDir,
} from "./utils";
import { ProjectConfig } from "./const";

let langMap = {};
const unhandled: string[] = [];

// 不要替换 intl.formatMessage 里的 defaultMessage
const needToReplace = (path) => {
  if (isIntlDefaultMessage(path)) {
    return false;
  }
  return true;
};

function findKeyByValue(targetValue: string) {
  return _.findKey(langMap, (value) => value === targetValue);
}

const replaceStringLiteralToI18nCallExpression = async (
  filepath: string,
  config: ProjectConfig
) => {
  // @ts-ignore
  const code = await pify(fs.readFile)(filepath, "utf-8");
  // @ts-ignore
  const ast = parser.parse(code, {
    plugins: ["jsx", "typescript"],
    sourceType: "module",
  });
  const traverse = traverser.default;

  const resolvedChineseWords: string[] = [];
  const firstNode = ast.program.body[0];
  let hasUseIntlImport = false;

  traverse(ast, {
    enter(path) {
      const node = path.node;
      if (!needToReplace(path)) return;

      const nodeType = node.type;
      // FIXME: 处理模版字符串
      if (nodeType === "TemplateElement" && hasChinese(node?.value?.raw)) {
        unhandled.push(
          `${filepath}:${node?.loc?.start?.line}::${node?.loc?.start?.column}`
        );
        return;
      }
      const supportedNodeType = ["StringLiteral", "JSXText"];
      if (!supportedNodeType.includes(nodeType)) return;

      const nodeValue: string = path.node.value
        ?.replace(/^[\n ]+/, "")
        ?.replace(/[\n ]+$/, "");
      const id = findKeyByValue(nodeValue);
      if (!hasChinese(nodeValue)) return;
      if (!id) {
        unhandled.push(
          `${filepath}:${node?.loc?.start?.line}::${node?.loc?.start?.column}`
        );
        return;
      }
      resolvedChineseWords.push(nodeValue);

      const parentNode = path.parentPath.node;
      const parentType = parentNode.type;
      const properties = [
        t.objectProperty(t.identifier("id"), t.stringLiteral(id)),
      ];
      if (config.keepDefaultMessage)
        properties.push(
          t.objectProperty(
            t.identifier("defaultMessage"),
            t.stringLiteral(path.node.value)
          )
        );
      const tCallExpression = t.callExpression(
        t.memberExpression(t.identifier("intl"), t.identifier("formatMessage")),
        [t.objectExpression(properties)]
      );
      switch (parentType) {
        case "JSXElement":
        case "JSXAttribute":
        case "JSXText": {
          // 在JSX里面的内容因为需要{}来包裹变量，因此需要将函数调用放入JSXExpressionContainer中
          path.replaceWith(t.jSXExpressionContainer(tCallExpression));
          break;
        }
        default: {
          path.replaceWith(tCallExpression);
          break;
        }
      }
    },
    ImportDeclaration(path) {
      // 检查 import 语句中是否包含 useIntl
      const importedIdentifiers = path.node.specifiers.map(
        (specifier) => specifier.local.name
      );
      if (importedIdentifiers.includes("useIntl")) {
        hasUseIntlImport = true;
      }
    },
  });

  if (!resolvedChineseWords.length) return;
  if (!hasUseIntlImport) {
    // 创建 import 语句
    const importStatement = t.importDeclaration(
      [t.importSpecifier(t.identifier("useIntl"), t.identifier("useIntl"))],
      t.stringLiteral("@umijs/max")
    );
    // FIXME: 声明 const intl = useIntl()
    t.addComment(firstNode, "leading", "TODO: const intl = useIntl();", true);
    // 插入 import 语句到 AST 的第一个位置
    ast.program.body.unshift(importStatement);
  }

  const newCode = generator.default(
    ast,
    { retainLines: true, jsescOption: { minimal: true } },
    code
  ).code;
  const formattedCode = await prettier.format(newCode, config.prettierOptions);

  fs.writeFileSync(filepath, formattedCode, "utf-8");
};

async function replace() {
  const config = getProjectConfig();
  mkCorei18nDir();

  // 获取本地文案
  langMap = await getLocalLangMap(config);

  // 获取scan后新增的文案
  const tempLangPath = path.resolve(process.cwd(), config.tempLangFile);
  if (fs.existsSync(tempLangPath)) {
    // @ts-ignore
    const jsonStr = await pify(fs.readFile)(tempLangPath, "utf-8");
    // @ts-ignore
    const json = JSON.parse(jsonStr);
    if (json) langMap = _.merge({}, langMap, json);
  }
  console.log("\n✅ 文案解析完成");

  const dirPath = path.resolve(process.cwd(), config.path);
  const files = await glob(dirPath, { ignore: config.ignoreFile });
  files.forEach((file) =>
    replaceStringLiteralToI18nCallExpression(file, config)
  );

  console.log("\n✅ 文案替换完成");
  if (!!unhandled.length) {
    console.log(
      "\n⚠️ 以下位置的文案未处理，可能为模版字符串或缺少文案id，请手动处理：\n"
    );
    console.log(unhandled.join("\n"));
  }

  // 删除临时文件
  removeTempDir();
}

export default replace;
