import { ProjectConfig } from "../const";
import request from "request";
import querystring from "querystring";
import crypto from "crypto";
import _ from "lodash";

function baiduTranslate(
  appid: string,
  secret: string,
  to = "en",
  from = "auto"
) {
  function signature(query) {
    let string = appid + query + "salt" + secret;
    const md5 = crypto.createHash("md5");
    md5.update(string);
    return md5.digest("hex");
  }

  function translate(q): Promise<{
    error_code: string;
    error_msg: string;
    from: string;
    to: string;
    trans_result: { src: string; dst: string }[];
  }> {
    return new Promise((resolve, reject) => {
      const postData = {
        q,
        from: from,
        to: to,
      };
      let form = postData || ({} as any);
      let sign = signature(form.q);
      form.appid = appid;
      form.salt = "salt";
      form.sign = sign;
      request.post(
        {
          url: "http://api.fanyi.baidu.com/api/trans/vip/translate",
          form: querystring.stringify(form),
        },
        function (err, httpResponse, body) {
          if (err) {
            return console.error(err);
          }
          body = JSON.parse(body);
          resolve(body);
        }
      );
    });
  }
  return translate;
}

/**
 * 百度单次翻译任务
 * @param text 待翻译文案
 * @param toLang 目标语种
 */
export async function translateTextByBaidu(
  text: string,
  baiduApiKey: ProjectConfig["baiduApiKey"]
): Promise<{
  from: string;
  to: string;
  trans_result: {
    src: string;
    dst: string;
  }[];
}> {
  const { appId, appKey } = baiduApiKey;
  const data = await baiduTranslate(appId, appKey, "en", "zh")(text);
  if (data && data.trans_result) return data;
  else
    throw new Error(
      `百度翻译api调用异常 error_code: ${data?.error_code}, error_msg: ${data?.error_msg}`
    );
}
