#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import inquirer from "inquirer";
import path from "path";
import fs from "fs";
import { I18N_CONFIG_FILE } from "./const.js";
import { initProject } from "./init.js";
import scan from "./scan.js";
import replace from "./replace.js";
/**
 * 进度条加载
 * @param text
 * @param callback
 */
function spining(text, callback) {
    const spinner = ora(`${text}中...`).start();
    if (callback) {
        if (callback() !== false) {
            spinner.succeed(`${text}成功`);
        }
        else {
            spinner.fail(`${text}失败`);
        }
    }
}
const program = new Command();
program
    .version("1.0.0")
    .option("-i, --init", "初始化项目")
    .option("-s, --scan", "扫描指定文件夹下的所有中文文案")
    .option("-r, --replace", "一键替换指定文件夹下的所有中文文案")
    .parse(process.argv);
const options = program.opts();
if (options.init) {
    (async () => {
        const configFilePath = path.join(process.cwd(), I18N_CONFIG_FILE);
        // 检查文件是否存在
        if (fs.existsSync(configFilePath)) {
            const answer = await inquirer.prompt({
                type: "confirm",
                name: "override",
                message: `${I18N_CONFIG_FILE} 已存在。是否覆盖当前配置？`,
                default: false,
            });
            if (!answer.override) {
                process.exit(0);
            }
        }
        initProject();
    })();
}
if (options.scan) {
    scan();
}
if (options.replace) {
    replace();
}
//# sourceMappingURL=index.js.map