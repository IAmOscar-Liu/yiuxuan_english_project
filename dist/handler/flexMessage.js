"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLearningSummaryFlexMessage = handleLearningSummaryFlexMessage;
exports.handleLearningSummaryCarouselMessage = handleLearningSummaryCarouselMessage;
const client_1 = __importDefault(require("../lib/client"));
const textMessage_1 = require("./textMessage");
const formatter_1 = require("../lib/formatter");
function buildLearningSummaryFlexMessage({ id, summaryJson, updatedAt, }) {
    var _a, _b, _c;
    const starCount = summaryJson.score ? Math.round(summaryJson.score) : 0;
    const lightStarUrl = "https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png";
    const darkStarUrl = "https://developers-resource.landpress.line.me/fx/img/review_gray_star_28.png";
    const flexMessageJson = {
        type: "bubble",
        hero: {
            type: "image",
            url: "https://developers-resource.landpress.line.me/fx/img/01_1_cafe.png",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
            action: {
                type: "uri",
                uri: "https://line.me/",
            },
        },
        body: {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "text",
                    text: (_a = summaryJson.topic) !== null && _a !== void 0 ? _a : "N/A",
                    weight: "bold",
                    size: "xl",
                },
                {
                    type: "text",
                    text: (_b = summaryJson.involvedKnowledge) !== null && _b !== void 0 ? _b : "N/A", // <-- Add your subtitle text here
                    size: "sm",
                    color: "#888888",
                    margin: "md",
                },
                {
                    type: "box",
                    layout: "baseline",
                    margin: "md",
                    contents: [
                        {
                            type: "icon",
                            size: "sm",
                            url: starCount >= 1 ? lightStarUrl : darkStarUrl,
                        },
                        {
                            type: "icon",
                            size: "sm",
                            url: starCount >= 2 ? lightStarUrl : darkStarUrl,
                        },
                        {
                            type: "icon",
                            size: "sm",
                            url: starCount >= 3 ? lightStarUrl : darkStarUrl,
                        },
                        {
                            type: "icon",
                            size: "sm",
                            url: starCount >= 4 ? lightStarUrl : darkStarUrl,
                        },
                        {
                            type: "icon",
                            size: "sm",
                            url: starCount >= 5 ? lightStarUrl : darkStarUrl,
                        },
                        {
                            type: "text",
                            text: typeof summaryJson.score === "number"
                                ? String(summaryJson.score.toFixed(1))
                                : "N/A",
                            size: "sm",
                            color: "#999999",
                            margin: "md",
                            flex: 0,
                        },
                    ],
                },
                {
                    type: "box",
                    layout: "vertical",
                    margin: "lg",
                    spacing: "sm",
                    contents: [
                        {
                            type: "box",
                            layout: "baseline",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "text",
                                    text: "評語",
                                    color: "#aaaaaa",
                                    size: "sm",
                                    flex: 1,
                                },
                                {
                                    type: "text",
                                    text: (_c = summaryJson.comment) !== null && _c !== void 0 ? _c : "N/A",
                                    wrap: true,
                                    color: "#666666",
                                    size: "sm",
                                    flex: 5,
                                },
                            ],
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "text",
                                    text: "完成時間",
                                    color: "#aaaaaa",
                                    size: "sm",
                                    flex: 2,
                                    maxLines: 1,
                                    wrap: false,
                                },
                                {
                                    type: "text",
                                    text: updatedAt
                                        ? (0, formatter_1.formatDateToString)(updatedAt.toDate())
                                        : "N/A",
                                    wrap: true,
                                    color: "#666666",
                                    size: "sm",
                                    flex: 5,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
                {
                    type: "button",
                    style: "link",
                    height: "sm",
                    action: {
                        type: "uri",
                        label: "查看細節",
                        uri: `${process.env.LINE_LIFF_URL}/chat-details.html?threadId=${id}`,
                    },
                },
                {
                    type: "box",
                    layout: "vertical",
                    contents: [],
                    margin: "sm",
                },
            ],
            flex: 0,
        },
    };
    return flexMessageJson;
}
function handleLearningSummaryFlexMessage({ replyToken, data, }) {
    if (!replyToken)
        return Promise.resolve(null);
    // Create the message object to be sent
    const message = {
        type: "flex",
        altText: "您的學習成果圖卡",
        contents: buildLearningSummaryFlexMessage(data),
    };
    return client_1.default.replyMessage({
        replyToken,
        messages: [message],
    });
}
function handleLearningSummaryCarouselMessage({ replyToken, chats, }) {
    if (!replyToken)
        return Promise.resolve(null);
    if (chats.length === 0)
        return (0, textMessage_1.handleTextMessage)({
            replyToken,
            text: "您目前沒有學習成果圖卡，趕快開始一個新任務吧！",
        });
    const echo = {
        type: "text",
        text: `以下是您近${chats.length}次的學習成果圖卡`,
    };
    const message = {
        type: "flex",
        altText: `以下是您近${chats.length}次的學習成果圖卡`,
        contents: {
            type: "carousel",
            contents: chats.map(buildLearningSummaryFlexMessage),
        },
    };
    return client_1.default.replyMessage({
        replyToken,
        messages: [echo, message],
    });
}
//# sourceMappingURL=flexMessage.js.map