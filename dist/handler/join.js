"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleJoin = handleJoin;
const client_1 = __importDefault(require("../lib/client"));
function handleJoin({ replyToken }) {
    const welcomeMessage = {
        type: "text",
        text: "Welcome! Thank you for joining.",
    };
    return client_1.default.replyMessage({
        replyToken,
        messages: [welcomeMessage],
    });
}
//# sourceMappingURL=join.js.map