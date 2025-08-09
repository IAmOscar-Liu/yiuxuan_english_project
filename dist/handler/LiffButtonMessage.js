"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLiffButtonMessage = handleLiffButtonMessage;
const client_1 = __importDefault(require("../lib/client"));
function handleLiffButtonMessage({ replyToken, liffUrl, title, label, }) {
    if (!replyToken)
        return Promise.resolve(null);
    const message = {
        type: "template",
        altText: title,
        template: {
            type: "buttons",
            text: title,
            actions: [
                {
                    type: "uri",
                    label,
                    uri: liffUrl,
                },
            ],
        },
    };
    return client_1.default.replyMessage({
        replyToken,
        messages: [message],
    });
}
//# sourceMappingURL=LiffButtonMessage.js.map