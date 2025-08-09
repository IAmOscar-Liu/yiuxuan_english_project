"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const bot_sdk_1 = require("@line/bot-sdk");
require("dotenv/config");
const richMenuArea_1 = require("./constants/richMenuArea");
const client = new bot_sdk_1.messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});
const blobClient = new bot_sdk_1.messagingApi.MessagingApiBlobClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});
function createRichMenu(_a) {
    return __awaiter(this, arguments, void 0, function* ({ richMenu, filename, richMenuAliasId, }) {
        // Create the rich menu
        const richMenuId = (yield client.createRichMenu(richMenu)).richMenuId;
        // Upload the image
        const imagePath = path.join(__dirname, "assets", filename);
        const imageBuffer = fs.readFileSync(imagePath);
        yield blobClient.setRichMenuImage(richMenuId, new Blob([imageBuffer], { type: "image/jpeg" }));
        const aliasList = yield client.getRichMenuAliasList();
        if (!!aliasList.aliases.find((a) => a.richMenuAliasId === richMenuAliasId)) {
            yield client.deleteRichMenuAlias(richMenuAliasId);
        }
        yield client.createRichMenuAlias({
            richMenuId,
            richMenuAliasId: richMenuAliasId,
        });
        console.log(`richMenuAliasId '${richMenuAliasId}' is set`);
        return richMenuId;
    });
}
// async function createRichMenuA(filename: string) {
//   // Define the rich menu structure
//   const richMenu: messagingApi.RichMenuRequest = {
//     size: { width: 2500, height: 1686 }, // compact size
//     selected: true,
//     name: "Compact Menu A",
//     chatBarText: "主選單",
//     areas: richMenuAArea,
//   };
//   // Create the rich menu
//   const richMenuId = (await client.createRichMenu(richMenu)).richMenuId;
//   // Upload the image
//   const imagePath = path.join(__dirname, "assets", filename);
//   const imageBuffer = fs.readFileSync(imagePath);
//   await blobClient.setRichMenuImage(
//     richMenuId,
//     new Blob([imageBuffer], { type: "image/jpeg" })
//   );
//   const aliasList = await client.getRichMenuAliasList();
//   if (
//     !!aliasList.aliases.find((a) => a.richMenuAliasId === "richmenu-alias-a")
//   ) {
//     await client.deleteRichMenuAlias("richmenu-alias-a");
//   }
//   await client.createRichMenuAlias({
//     richMenuId,
//     richMenuAliasId: "richmenu-alias-a",
//   });
//   console.log("richMenuAliasId 'richmenu-alias-a' is set");
//   return richMenuId;
// }
// async function createRichMenuB(filename: string) {
//   // Define the rich menu structure
//   const richMenu: messagingApi.RichMenuRequest = {
//     size: { width: 2500, height: 1686 }, // compact size
//     selected: true,
//     name: "Compact Menu B",
//     chatBarText: "主選單",
//     areas: richMenuBArea,
//   };
//   // Create the rich menu
//   const richMenuId = (await client.createRichMenu(richMenu)).richMenuId;
//   // Upload the image
//   const imagePath = path.join(__dirname, "assets", filename);
//   const imageBuffer = fs.readFileSync(imagePath);
//   await blobClient.setRichMenuImage(
//     richMenuId,
//     new Blob([imageBuffer], { type: "image/jpeg" })
//   );
//   const aliasList = await client.getRichMenuAliasList();
//   if (
//     !!aliasList.aliases.find((a) => a.richMenuAliasId === "richmenu-alias-b")
//   ) {
//     await client.deleteRichMenuAlias("richmenu-alias-b");
//   }
//   await client.createRichMenuAlias({
//     richMenuId,
//     richMenuAliasId: "richmenu-alias-b",
//   });
//   console.log("richMenuAliasId 'richmenu-alias-b' is set");
//   return richMenuId;
// }
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const richMenuAId = yield createRichMenu({
            richMenu: {
                size: { width: 2500, height: 1686 }, // compact size
                selected: true,
                name: "Compact Menu A",
                chatBarText: "主選單",
                areas: richMenuArea_1.richMenuAArea,
            },
            richMenuAliasId: "richmenu-alias-a",
            filename: "richmenu_1753452577497.jpg",
        });
        const richMenuBId = yield createRichMenu({
            richMenu: {
                size: { width: 2500, height: 1686 }, // compact size
                selected: true,
                name: "Compact Menu B",
                chatBarText: "主選單",
                areas: richMenuArea_1.richMenuBArea,
            },
            richMenuAliasId: "richmenu-alias-b",
            filename: "richmenu_1754533767864.jpg",
        });
        // Save the rich menu IDs to a JSON file
        const outputPath = path.join(__dirname, "../richMenuIds.json");
        fs.writeFileSync(outputPath, JSON.stringify({ richMenuAId, richMenuBId }, null, 2), "utf-8");
        console.log("Rich menu IDs saved to:", outputPath);
        // Set the rich menu as the default
        yield client.setDefaultRichMenu(richMenuAId);
        client.linkRichMenuIdToUser;
        console.log("Rich menu created and set as default:", richMenuAId);
    });
}
main();
//# sourceMappingURL=createRichMenu.js.map