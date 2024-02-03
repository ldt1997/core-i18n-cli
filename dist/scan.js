import parser from "@babel/parser";
import traverser from "@babel/traverse";
import fs from "fs";
import { glob } from "glob";
import _ from "lodash";
import path from "path";
import { getProjectConfig, hasChinese, trimChinese, generateHash, translateTextByBaidu, isIntlDefaultMessage, getLocalLangMap, removeTempDir, } from "./utils/index.js";
const result = {};
const resolveChineseWordsFromTSX = (path) => new Promise((resolve) => {
    fs.readFile(path, "utf-8", (err, data) => {
        if (err)
            throw new Error("resolveChineseWordsFromTSX Error: " + err);
        const ast = parser.parse(data, {
            plugins: ["jsx", "typescript"],
            sourceType: "module",
        });
        const traverse = traverser.default;
        const words = [];
        traverse(ast, {
            enter(path) {
                if (path.node.type !== "StringLiteral" &&
                    path.node.type !== "JSXText")
                    return;
                if (isIntlDefaultMessage(path))
                    return;
                const value = trimChinese(path.node.value);
                if (!hasChinese(value))
                    return;
                words.push(value);
            },
        });
        resolve(words);
    });
});
async function generateIds(words, config) {
    if (config.idType === "translate") {
        // 为了节省字符数，截取文案前10个字符进行翻译，并选取翻译后的前6个字符作为key
        const texts = words.map((item) => item.slice(0, 10));
        // api每次最多翻译2000个汉字，需要做一下分批处理，每100条请求一次
        const textChunks = _.chunk(texts, 100).map((item) => item.join("\n"));
        const promises = textChunks.map((item) => translateTextByBaidu(item, config.baiduApiKey));
        const transResults = await Promise.all(promises).then((results) => results
            .map((res) => res?.trans_result?.map((item) => item.dst
            ?.toLowerCase()
            ?.replace(/[^a-zA-Z0-9\s]/g, "")
            ?.split(" ")
            ?.slice(0, 6)
            ?.join("_")))
            .flat());
        return transResults;
    }
    else {
        return words.map((word) => generateHash(word, 6));
    }
}
async function scan() {
    const config = getProjectConfig();
    const dirPath = path.resolve(process.cwd(), config.path);
    const files = await glob(dirPath, { ignore: config.ignoreFile });
    console.log("\n✅ 文件路径解析完成");
    let allWords = [];
    // 获取所有的中文文案并去重
    for (const file of files) {
        const words = await resolveChineseWordsFromTSX(file);
        allWords.push(...words);
    }
    allWords = _.uniq(allWords);
    let newWords = allWords;
    // 解析已有文案
    const localLangMap = await getLocalLangMap(config);
    // 过滤出新增的文案
    if (!_.isEmpty(localLangMap)) {
        const values = _.values(localLangMap);
        newWords = allWords.filter((item) => !values.includes(item));
    }
    console.log("\n✅ 扫描文案完成，发现 " + newWords.length + " 条未翻译文案");
    // 为新增文案生成id
    if (!!newWords.length) {
        const ids = await generateIds(newWords, config);
        for (let i = 0; i < newWords.length; i++) {
            const word = newWords[i];
            let id = ids[i];
            if (!!result[id] || !!localLangMap[id])
                id = id + "_" + generateHash(Date.now().toString(), 4);
            if (!!config.idSuffix)
                id = config.idSuffix + "." + id;
            result[id] = word;
        }
        fs.writeFileSync(path.resolve(process.cwd(), config.tempLangFile), JSON.stringify(result, null, 2), "utf-8");
        console.log("\n✅ 扫描完成，新增文案已存放至目录: " +
            path.resolve(process.cwd(), config.tempLangFile));
    }
    // 删除临时文件
    removeTempDir();
}
export default scan;
//# sourceMappingURL=scan.js.map