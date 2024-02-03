import * as _ from "lodash";
import * as path from "path";
import * as fs from "fs";
import { PROJECT_CONFIG, I18N_CONFIG_FILE } from "./const";

function initProject() {
  // 写入配置文件路径
  const configFilePath = path.join(process.cwd(), I18N_CONFIG_FILE);
  // 写入配置文件
  fs.writeFileSync(
    configFilePath,
    JSON.stringify(PROJECT_CONFIG, null, 2),
    "utf-8"
  );

  console.log(`✅ ${I18N_CONFIG_FILE} created successfully.`);
}

export { initProject };
