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
const bot_sdk_1 = require("@line/bot-sdk");
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const richMenuArea_1 = require("./constants/richMenuArea");
const confirmMessage_1 = require("./handler/confirmMessage");
const flexMessage_1 = require("./handler/flexMessage");
const join_1 = require("./handler/join");
const LiffButtonMessage_1 = require("./handler/LiffButtonMessage");
const linkRichMenuIdToUser_1 = require("./handler/linkRichMenuIdToUser");
const others_1 = require("./handler/others");
const textMessage_1 = require("./handler/textMessage");
const firebase_admin_1 = require("./lib/firebase_admin");
const formatter_1 = require("./lib/formatter");
const openAI_1 = require("./lib/openAI");
const readRichMenuId_1 = require("./lib/readRichMenuId");
// create LINE SDK config from env variables
const lineMiddleware = (0, bot_sdk_1.middleware)({
    channelSecret: process.env.LINE_CHANNEL_SECRET,
});
console.log(process.env.NODE_ENV);
console.log(process.env.LINE_CHANNEL_SECRET);
// create Express app
// about Express itself: https://expressjs.com/
const app = (0, express_1.default)();
const corsOptions = {
    origin: "*", // Your Netlify domain
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allow sending cookies/authorization headers
}; // Use the cors middleware
app.get("/api/test", (req, res) => {
    res.json({ result: "success" });
});
app.post("/api/push-message", (0, cors_1.default)(corsOptions), express_1.default.json(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Make the function async
    const { userId, message } = req.body;
    if (!userId || !message) {
        return res
            .status(400)
            .send({ error: "Missing userId or message in request body." });
    }
    try {
        const response = yield fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Ensure LINE_CHANNEL_ACCESS_TOKEN is set in your environment variables
                Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                to: userId,
                messages: [
                    {
                        type: "text",
                        text: message,
                    },
                ],
            }),
        });
        // Check if the LINE API request was successful
        if (response.ok) {
            console.log(`Push message sent to ${userId}`);
            res
                .status(200)
                .send({ success: true, message: "Push message sent successfully." });
        }
        else {
            const errorData = yield response.json();
            console.error(`Failed to send push message to ${userId}:`, errorData);
            res.status(response.status).send({ success: false, error: errorData });
        }
    }
    catch (error) {
        console.error("Error sending push message:", error);
        res.status(500).send({ success: false, error: "Internal server error." });
    }
}));
// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post("/api/callback", lineMiddleware, (req, res) => {
    console.log("Received events:", req.body.events);
    Promise.all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
        console.error(err);
        res.status(500).end();
    });
});
// The type of `event` is `line.messagingApi.WebhookEvent` from the @line/bot-sdk package.
function handleEvent(event) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
    if (event.type === "join" || event.type === "follow")
        return (0, join_1.handleJoin)({ replyToken: event.replyToken });
    if (event.type === "message" && event.message.type === "text") {
        if (event.message.text.trim().toLocaleLowerCase() === "help")
            return (0, confirmMessage_1.handleConfirmMessage)({
                replyToken: event.replyToken,
                text: "Need help?",
                actions: [
                    { type: "postback", label: "yes", data: "user_need_help" },
                    { type: "postback", label: "no", data: "user_no_need_help" },
                ],
            });
        if (event.message.text === "我的身分") {
            return (0, firebase_admin_1.getUserDocumentById)((_b = (_a = event.source) === null || _a === void 0 ? void 0 : _a.userId) !== null && _b !== void 0 ? _b : "").then((user) => {
                if (!user)
                    return (0, LiffButtonMessage_1.handleLiffButtonMessage)({
                        replyToken: event.replyToken,
                        liffUrl: process.env.LINE_LIFF_URL,
                        title: "您尚未擁有帳號，點此開始註冊",
                        label: "註冊",
                    });
                if (user.isLoggedIn)
                    return Promise.resolve(null);
                return (0, confirmMessage_1.handleConfirmMessage)({
                    replyToken: event.replyToken,
                    text: `您的身分為『${(0, formatter_1.formatUserRole)(user.role)}』，請問是否登入？`,
                    actions: [
                        { type: "postback", label: "是", data: "user_need_login" },
                        { type: "postback", label: "否", data: "user_no_need_login" },
                    ],
                });
            });
        }
        if (event.message.text === "我的帳號") {
            return (0, firebase_admin_1.getUserDocumentById)((_d = (_c = event.source) === null || _c === void 0 ? void 0 : _c.userId) !== null && _d !== void 0 ? _d : "").then((user) => {
                if (!user || !user.isLoggedIn)
                    return Promise.resolve(null);
                return (0, confirmMessage_1.handleConfirmMessage)({
                    replyToken: event.replyToken,
                    text: "我的帳號",
                    actions: [
                        {
                            type: "uri",
                            label: "查看",
                            uri: process.env.LINE_LIFF_URL + "/account.html",
                        },
                        { type: "postback", label: "登出", data: "user_need_logout" },
                    ],
                });
            });
        }
        if (event.message.text === "開始/結束任務") {
            return (0, firebase_admin_1.getUserDocumentById)((_f = (_e = event.source) === null || _e === void 0 ? void 0 : _e.userId) !== null && _f !== void 0 ? _f : "").then((user) => {
                if (!user || !user.isLoggedIn)
                    return Promise.resolve(null);
                if (user.threadId) {
                    return (0, confirmMessage_1.handleConfirmMessage)({
                        replyToken: event.replyToken,
                        text: "是否結束目前任務？",
                        actions: [
                            { type: "postback", label: "是", data: "user_cancel_task" },
                            { type: "postback", label: "否", data: "user_not_cancel_task" },
                        ],
                    });
                }
                return (0, confirmMessage_1.handleConfirmMessage)({
                    replyToken: event.replyToken,
                    text: "是否開始新任務？",
                    actions: [
                        { type: "postback", label: "是", data: "user_initiate_task" },
                        { type: "postback", label: "否", data: "user_not_initiate_task" },
                    ],
                });
            });
        }
        if (event.message.text === "我的成果圖卡")
            return (0, firebase_admin_1.getUserDocumentById)((_h = (_g = event.source) === null || _g === void 0 ? void 0 : _g.userId) !== null && _h !== void 0 ? _h : "").then((user) => __awaiter(this, void 0, void 0, function* () {
                if (!user || !user.isLoggedIn)
                    return Promise.resolve(null);
                const chatDocs = yield (0, firebase_admin_1.getChatDocumentsByUserId)(user.id);
                return (0, flexMessage_1.handleLearningSummaryCarouselMessage)({
                    replyToken: event.replyToken,
                    chats: chatDocs,
                });
            }));
        if (event.message.text === "任務記錄")
            return (0, firebase_admin_1.getUserDocumentById)((_k = (_j = event.source) === null || _j === void 0 ? void 0 : _j.userId) !== null && _k !== void 0 ? _k : "").then((user) => {
                if (!user || !user.isLoggedIn)
                    return Promise.resolve(null);
                return (0, LiffButtonMessage_1.handleLiffButtonMessage)({
                    replyToken: event.replyToken,
                    liffUrl: process.env.LINE_LIFF_URL + "/chats.html",
                    title: "點此查看您的任務記錄",
                    label: "查看",
                });
            });
        if (event.message.text === "問題回報")
            return (0, firebase_admin_1.getUserDocumentById)((_m = (_l = event.source) === null || _l === void 0 ? void 0 : _l.userId) !== null && _m !== void 0 ? _m : "").then((user) => {
                if (!user || !user.isLoggedIn)
                    return Promise.resolve(null);
                return (0, LiffButtonMessage_1.handleLiffButtonMessage)({
                    replyToken: event.replyToken,
                    liffUrl: process.env.LINE_LIFF_URL + "/report.html",
                    title: "點此回報您的問題",
                    label: "回報",
                });
            });
        // handle user click richMenu
        const textMessage = event.message.text;
        if (richMenuArea_1.richMenuAArea.find((area) => { var _a; return ((_a = area.action) === null || _a === void 0 ? void 0 : _a.type) === "message" && area.action.text === textMessage; }) ||
            richMenuArea_1.richMenuBArea.find((area) => { var _a; return ((_a = area.action) === null || _a === void 0 ? void 0 : _a.type) === "message" && area.action.text === textMessage; })) {
            return (0, textMessage_1.handleTextMessage)({
                replyToken: event.replyToken,
                text: "此功能正在開發，敬請期待！",
            });
        }
        // handle user send text message
        return (0, firebase_admin_1.getUserDocumentById)((_p = (_o = event.source) === null || _o === void 0 ? void 0 : _o.userId) !== null && _p !== void 0 ? _p : "").then((user) => __awaiter(this, void 0, void 0, function* () {
            if (user && user.isLoggedIn) {
                if (user.runId)
                    return (0, textMessage_1.handleTextMessage)({
                        replyToken: event.replyToken,
                        text: "系統正在回覆您的訊息，請稍後......",
                    });
                if (user.threadId) {
                    const openAIResult = yield openAI_1.OpenAILib.chat({
                        user,
                        message: textMessage,
                        shouldSaveConversation: true,
                    });
                    const text = openAIResult.success
                        ? openAIResult.data
                        : `很抱歉，系統目前無法回覆你的訊息 - ${openAIResult.error}`;
                    return (0, textMessage_1.handleTextMessage)({
                        replyToken: event.replyToken,
                        text,
                    });
                }
                return Promise.resolve(null);
            }
            return Promise.resolve(null);
        }));
    }
    if (event.type === "postback") {
        if (event.postback.data === "user_need_help") {
            return (0, textMessage_1.handleTextMessage)({
                replyToken: event.replyToken,
                text: "Sorry! I can't help you.",
            });
        }
        if (event.postback.data === "user_need_login") {
            return (0, firebase_admin_1.getUserDocumentById)((_r = (_q = event.source) === null || _q === void 0 ? void 0 : _q.userId) !== null && _r !== void 0 ? _r : "").then((user) => {
                if (!user)
                    return Promise.resolve(null);
                (0, firebase_admin_1.logInUser)(user.id);
                return (0, linkRichMenuIdToUser_1.handleLinkRichMenuIdToUser)({
                    richMenuId: (0, readRichMenuId_1.readRichMenuBId)("richMenuBId"),
                    userId: user.id,
                    replyToken: event.replyToken,
                    successMsg: "您已成功登入",
                    failureMsg: "登入失敗，請重新再試",
                });
            });
        }
        if (event.postback.data === "user_need_logout") {
            return (0, firebase_admin_1.getUserDocumentById)((_t = (_s = event.source) === null || _s === void 0 ? void 0 : _s.userId) !== null && _t !== void 0 ? _t : "").then((user) => {
                if (!user)
                    return Promise.resolve(null);
                (0, firebase_admin_1.logOutUser)(user.id);
                return (0, linkRichMenuIdToUser_1.handleUnLinkRichMenuIdToUser)({
                    userId: user.id,
                    replyToken: event.replyToken,
                    successMsg: "您已成功登出",
                    failureMsg: "登出失敗，請重新再試",
                });
            });
        }
        if (event.postback.data === "user_initiate_task") {
            return (0, firebase_admin_1.getUserDocumentById)((_v = (_u = event.source) === null || _u === void 0 ? void 0 : _u.userId) !== null && _v !== void 0 ? _v : "").then((user) => {
                if (!user || !user.isLoggedIn)
                    return Promise.resolve(null);
                if (user.threadId)
                    return (0, textMessage_1.handleTextMessage)({
                        replyToken: event.replyToken,
                        text: "任務已開始",
                    });
                return (0, others_1.handleLearningQuickReply)({
                    replyToken: event.replyToken,
                    user,
                });
            });
        }
        if (event.postback.data === "user_cancel_task") {
            return (0, firebase_admin_1.getUserDocumentById)((_x = (_w = event.source) === null || _w === void 0 ? void 0 : _w.userId) !== null && _x !== void 0 ? _x : "").then((user) => __awaiter(this, void 0, void 0, function* () {
                if (!user || !user.isLoggedIn)
                    return Promise.resolve(null);
                if (!user.threadId)
                    return (0, textMessage_1.handleTextMessage)({
                        replyToken: event.replyToken,
                        text: "任務已結束",
                    });
                const chatDoc = yield (0, firebase_admin_1.getChatDocumentById)(user.threadId, {
                    showDebug: true,
                });
                // 如果聊天訊息少於10條, 直接結束任務
                if (!chatDoc ||
                    !Array.isArray(chatDoc.data) ||
                    chatDoc.data.length < 10) {
                    yield openAI_1.OpenAILib.deleteChat(user);
                    return (0, textMessage_1.handleTextMessage)({
                        replyToken: event.replyToken,
                        text: "任務結束",
                    });
                }
                return (0, confirmMessage_1.handleConfirmMessage)({
                    replyToken: event.replyToken,
                    text: `是否要總結本次的學習成果？`,
                    actions: [
                        {
                            type: "postback",
                            label: "是",
                            data: "user_require_learning_summary",
                        },
                        {
                            type: "postback",
                            label: "否",
                            data: "user_not_require_learning_summary",
                        },
                    ],
                });
            }));
        }
        if (event.postback.data === "user_require_learning_summary" ||
            event.postback.data === "user_not_require_learning_summary") {
            return (0, firebase_admin_1.getUserDocumentById)((_z = (_y = event.source) === null || _y === void 0 ? void 0 : _y.userId) !== null && _z !== void 0 ? _z : "").then((user) => __awaiter(this, void 0, void 0, function* () {
                if (!user || !user.isLoggedIn)
                    return Promise.resolve(null);
                if (!user.threadId)
                    return (0, textMessage_1.handleTextMessage)({
                        replyToken: event.replyToken,
                        text: "任務已結束",
                    });
                if (user.runId)
                    return (0, textMessage_1.handleTextMessage)({
                        replyToken: event.replyToken,
                        text: "系統正在回覆您的訊息，請稍後......",
                    });
                let text = "任務結束";
                if (event.postback.data === "user_require_learning_summary") {
                    const openAIResult = yield openAI_1.OpenAILib.chat({
                        user,
                        message: "請給我成果回顧，例如學習紀錄，本次亮點、章節進度條、整體評分(0~5)&下一關挑戰引導",
                    });
                    if (openAIResult.success) {
                        text = openAIResult.data;
                        const json = yield openAI_1.OpenAILib.getJsonSummary(openAIResult.data);
                        if (openAIResult.threadId) {
                            yield (0, firebase_admin_1.addSummaryToChat)(openAIResult.threadId, { text, json });
                            yield openAI_1.OpenAILib.deleteChat(user);
                            return (0, others_1.handleLearningSummaryMessage)({
                                replyToken: event.replyToken,
                                text,
                                threadId: openAIResult.threadId,
                            });
                        }
                    }
                    else {
                        text = `很抱歉，系統目前無法回覆你的訊息 - ${openAIResult.error}`;
                    }
                }
                yield openAI_1.OpenAILib.deleteChat(user);
                return (0, textMessage_1.handleTextMessage)({
                    replyToken: event.replyToken,
                    text,
                });
            }));
        }
        if (event.postback.data === "user_want_learn_grammar") {
            return (0, firebase_admin_1.getUserDocumentById)((_1 = (_0 = event.source) === null || _0 === void 0 ? void 0 : _0.userId) !== null && _1 !== void 0 ? _1 : "").then((user) => __awaiter(this, void 0, void 0, function* () {
                if (!user || !user.isLoggedIn)
                    return Promise.resolve(null);
                if (user.threadId)
                    return (0, textMessage_1.handleTextMessage)({
                        replyToken: event.replyToken,
                        text: "任務已開始",
                    });
                const openAIResult = yield openAI_1.OpenAILib.chat({
                    user,
                    message: "我要學文法",
                    shouldCreateChat: true,
                    shouldSaveConversation: true,
                });
                const text = openAIResult.success
                    ? openAIResult.data
                    : `很抱歉，系統目前無法回覆你的訊息 - ${openAIResult.error}`;
                return (0, textMessage_1.handleTextMessage)({
                    replyToken: event.replyToken,
                    text,
                });
            }));
        }
        if (event.postback.data.startsWith("user_request_learning_summary_card:"))
            return (0, firebase_admin_1.getUserDocumentById)((_3 = (_2 = event.source) === null || _2 === void 0 ? void 0 : _2.userId) !== null && _3 !== void 0 ? _3 : "").then((user) => __awaiter(this, void 0, void 0, function* () {
                if (!user || !user.isLoggedIn)
                    return Promise.resolve(null);
                const threadId = event.postback.data.replace("user_request_learning_summary_card:", "");
                const chatDoc = yield (0, firebase_admin_1.getChatDocumentById)(threadId);
                if (!chatDoc)
                    return (0, textMessage_1.handleTextMessage)({
                        replyToken: event.replyToken,
                        text: "成果圖卡不存在",
                    });
                return (0, flexMessage_1.handleLearningSummaryFlexMessage)({
                    replyToken: event.replyToken,
                    data: chatDoc,
                });
            }));
    }
    return Promise.resolve(null);
}
if (process.env.NODE_ENV === "development") {
    // Set static folder
    app.use(express_1.default.static(__dirname + "/../liff/"));
    // Handle SPA
    app.get(/.*/, (_, res) => res.sendFile(__dirname + "/../liff/index.html"));
}
// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});
//# sourceMappingURL=index.js.map