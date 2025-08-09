"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConfirmMessage = handleConfirmMessage;
const client_1 = __importDefault(require("../lib/client"));
function handleConfirmMessage({ replyToken, altText, text, actions, }) {
    if (!replyToken)
        return Promise.resolve(null);
    //   // create an echoing text message
    // create an echoing text message
    const templateMessage = {
        type: "template",
        altText: altText || text,
        template: {
            type: "confirm",
            text,
            actions,
        },
    };
    // use reply API
    return client_1.default.replyMessage({
        replyToken,
        messages: [templateMessage],
    });
}
//# sourceMappingURL=confirmMessage.js.map