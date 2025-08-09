"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTextMessage = handleTextMessage;
const client_1 = __importDefault(require("../lib/client"));
function handleTextMessage({ text, replyToken, }) {
    if (!replyToken)
        return Promise.resolve(null);
    // create an echoing text message
    const echo = {
        type: "text",
        text,
    };
    // use reply API
    return client_1.default.replyMessage({
        replyToken,
        messages: [echo],
    });
}
//# sourceMappingURL=textMessage.js.map