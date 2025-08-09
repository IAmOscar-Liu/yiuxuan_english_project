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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLinkRichMenuIdToUser = handleLinkRichMenuIdToUser;
exports.handleUnLinkRichMenuIdToUser = handleUnLinkRichMenuIdToUser;
const client_1 = __importDefault(require("../lib/client"));
function handleLinkRichMenuIdToUser(_a) {
    return __awaiter(this, arguments, void 0, function* ({ userId, richMenuId, replyToken, successMsg, failureMsg, }) {
        if (!replyToken || !userId)
            return Promise.resolve(null);
        try {
            yield client_1.default.linkRichMenuIdToUser(userId, richMenuId);
            return client_1.default.replyMessage({
                replyToken,
                messages: [
                    {
                        type: "text",
                        text: successMsg ||
                            `Successfully link richMenuId ${richMenuId} to user ${userId}`,
                    },
                ],
            });
        }
        catch (error) {
            console.error(`Failed to link richMenuId to user: ${error}`);
            return client_1.default.replyMessage({
                replyToken,
                messages: [
                    {
                        type: "text",
                        text: failureMsg ||
                            `Failed to link richMenuId ${richMenuId} to user ${userId}`,
                    },
                ],
            });
        }
    });
}
function handleUnLinkRichMenuIdToUser(_a) {
    return __awaiter(this, arguments, void 0, function* ({ userId, replyToken, successMsg, failureMsg, }) {
        if (!replyToken || !userId)
            return Promise.resolve(null);
        try {
            yield client_1.default.unlinkRichMenuIdFromUser(userId);
            return client_1.default.replyMessage({
                replyToken,
                messages: [
                    {
                        type: "text",
                        text: successMsg || `Successfully unlink richMenuId to user ${userId}`,
                    },
                ],
            });
        }
        catch (error) {
            console.error(`Failed to link richMenuId to user: ${error}`);
            return client_1.default.replyMessage({
                replyToken,
                messages: [
                    {
                        type: "text",
                        text: failureMsg || `Failed to unlink richMenuId to user ${userId}`,
                    },
                ],
            });
        }
    });
}
//# sourceMappingURL=linkRichMenuIdToUser.js.map