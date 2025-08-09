"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blobClient = void 0;
const bot_sdk_1 = require("@line/bot-sdk");
const client = new bot_sdk_1.messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});
exports.blobClient = new bot_sdk_1.messagingApi.MessagingApiBlobClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});
exports.default = client;
//# sourceMappingURL=client.js.map