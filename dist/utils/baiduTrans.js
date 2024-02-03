import request from "request";
import querystring from "querystring";
import crypto from "crypto";
function baiduTranslate(appid, secret, to = "en", from = "auto") {
    function signature(query) {
        let string = appid + query + "salt" + secret;
        const md5 = crypto.createHash("md5");
        md5.update(string);
        return md5.digest("hex");
    }
    function translate(q) {
        return new Promise((resolve, reject) => {
            const postData = {
                q,
                from: from,
                to: to,
            };
            let form = postData || {};
            let sign = signature(form.q);
            form.appid = appid;
            form.salt = "salt";
            form.sign = sign;
            request.post({
                url: "http://api.fanyi.baidu.com/api/trans/vip/translate",
                form: querystring.stringify(form),
            }, function (err, httpResponse, body) {
                if (err) {
                    return console.error(err);
                }
                body = JSON.parse(body);
                resolve(body);
            });
        });
    }
    return translate;
}
/**
 * 百度单次翻译任务
 * @param text 待翻译文案
 * @param toLang 目标语种
 */
export async function translateTextByBaidu(text, baiduApiKey) {
    const { appId, appKey } = baiduApiKey;
    const data = await baiduTranslate(appId, appKey, "en", "zh")(text);
    if (data && data.trans_result)
        return data;
    else
        throw new Error(`百度翻译api调用异常 error_code: ${data?.error_code}, error_msg: ${data?.error_msg}`);
}
//# sourceMappingURL=baiduTrans.js.map