require('dotenv').config();

/**
 * Send SMS verification code via Aliyun SMS.
 * Falls back to console.log in dev if SDK is not installed.
 */
async function sendSmsCode(phone, code) {
  try {
    const dysmsapi20170525 = require('@alicloud/dysmsapi20170525');
    const OpenApi = require('@alicloud/openapi-client');

    const config = new OpenApi.Config({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    });
    config.endpoint = 'dysmsapi.aliyuncs.com';
    const client = new dysmsapi20170525.default(config);

    const sendSmsRequest = new dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: process.env.ALIYUN_SMS_SIGN_NAME,
      templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code }),
    });
    const response = await client.sendSms(sendSmsRequest);
    if (response.body.code !== 'OK') {
      throw new Error(`短信发送失败: ${response.body.message}`);
    }
    return true;
  } catch (e) {
    // Fallback for dev when SDK not installed
    console.log(`[DEV SMS] To: ${phone}  Code: ${code}`);
    throw e;
  }
}

module.exports = { sendSmsCode };
