import crypto from "crypto";
import _ from "lodash";

/**
 * @description 字符串是否包含中文
 * @param str
 * @returns boolean
 */
export const hasChinese = (str) => /\p{sc=Han}/gu.test(str);

/**
 * @description 去除中文的/n /t
 * @param str
 */
export function trimChinese(str) {
  return str?.replace(/^[\n ]+/, "")?.replace(/[\n ]+$/, "");
}

/**
 * @description 生成hash
 * @param text
 * @param length
 */
export function generateHash(text?: string, length: number = 16) {
  const hash = crypto.createHash("md5").update(text).digest("hex");
  return hash.slice(0, length);
}

/**
 * @description 当前Node是否为 intl.formatMessage || FormattedMessage
 * @param path
 * @returns
 */
export function isIntlDefaultMessage(path) {
  const ancestorIdentifier = path.findParent(
    (p) =>
      p.isCallExpression() &&
      // p?.node?.callee?.object?.name === "intl" &&
      p?.node?.callee?.property?.name === "formatMessage"
  );
  const isIntlFormatMessage =
    ["defaultMessage", "description"].includes(path?.parent?.key?.name) &&
    !!ancestorIdentifier;
  const ancestorJSXIdentifier = path.findParent(
    (p) =>
      p.isJSXElement() &&
      p?.node?.openingElement?.name?.name === "FormattedMessage"
  );
  const isFormatMessageJSX =
    ["defaultMessage", "description"].includes(path?.parent?.name?.name) &&
    !!ancestorJSXIdentifier;

  return isIntlFormatMessage || isFormatMessageJSX;
}
