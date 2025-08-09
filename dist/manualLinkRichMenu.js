"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_sdk_1 = require("@line/bot-sdk");
require("dotenv/config");
const client = new bot_sdk_1.messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});
manualLinkRichMenu({
    userId: "U8a4e9ad0021ae7b716ea668fe81d6bfc",
    richMenuId: "richmenu-a552b0592f689a17a2f1895a3c788e36",
});
function manualLinkRichMenu(_a) {
    return __awaiter(this, arguments, void 0, function* ({ userId, richMenuId, }) {
        // client.unlinkRichMenuIdFromUser("U8a4e9ad0021ae7b716ea668fe81d6bfc");
        yield client.linkRichMenuIdToUser(userId, richMenuId);
        console.log(`RichMenuId '${richMenuId}' has been manually linked to user '${userId}'`);
    });
}
//# sourceMappingURL=manualLinkRichMenu.js.map