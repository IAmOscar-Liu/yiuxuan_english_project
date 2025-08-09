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
exports.getUserDocumentById = getUserDocumentById;
exports.logInUser = logInUser;
exports.logOutUser = logOutUser;
exports.setThreadOrRunId = setThreadOrRunId;
exports.deleteThreadOrRunId = deleteThreadOrRunId;
exports.createChat = createChat;
exports.insertConversationToChat = insertConversationToChat;
exports.getChatDocumentById = getChatDocumentById;
exports.addSummaryToChat = addSummaryToChat;
exports.getChatDocumentsByUserId = getChatDocumentsByUserId;
// Import the Firebase Admin SDK
const admin = __importStar(require("firebase-admin"));
// Import your service account key JSON file
// Ensure the path is correct relative to this file
const serviceAccount = require("../../test-project-001-5703b-firebase-adminsdk-fbsvc-12982fd266.json");
// Initialize the Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://test-project-001-5703b-default-rtdb.firebaseio.com",
});
// Export the initialized admin objects
exports.default = admin;
function getUserDocumentById(userId, option) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get a reference to the Firestore database
            const db = admin.firestore();
            // Get a reference to the specific document in the 'user' collection
            const userDocRef = db.collection("user").doc(userId);
            // Fetch the document snapshot
            const userDoc = yield userDocRef.get();
            // Check if the document exists and return its data
            if (userDoc.exists) {
                console.log((option === null || option === void 0 ? void 0 : option.showDebug)
                    ? `Document data for user ID ${userId}: ${userDoc.data()}`
                    : `Document data for user ID ${userId} found`);
                return Object.assign(Object.assign({}, userDoc.data()), { id: userDoc.id });
                // return userDoc.data();
            }
            else {
                console.log(`No document found for user ID: ${userId}`);
                return undefined;
            }
        }
        catch (error) {
            console.error(`Error getting user document with ID ${userId}:`, error);
            throw undefined; // Re-throw the error for further handling
        }
    });
}
function logInUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = admin.firestore();
            const userDocRef = db.collection("user").doc(userId);
            yield userDocRef.set({ isLoggedIn: true }, { merge: true });
            console.log(`Log in user: ${userId}`);
            return true;
        }
        catch (error) {
            console.error(`Error logging in for user ID ${userId}:`, error);
            // throw error;
            return false;
        }
    });
}
function logOutUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = admin.firestore();
            const userDocRef = db.collection("user").doc(userId);
            yield userDocRef.set({
                isLoggedIn: false,
                threadId: admin.firestore.FieldValue.delete(),
                runId: admin.firestore.FieldValue.delete(),
            }, { merge: true });
            console.log(`Log out user: ${userId}`);
            return true;
        }
        catch (error) {
            console.error(`Error logging out for user ID ${userId}:`, error);
            // throw error;
            return false;
        }
    });
}
function setThreadOrRunId(userId, options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = admin.firestore();
            const userDocRef = db.collection("user").doc(userId);
            // Only update the fields that are provided
            const updateData = {};
            if (options.threadId !== undefined) {
                updateData.threadId = options.threadId;
            }
            if (options.runId !== undefined) {
                updateData.runId = options.runId;
            }
            if (Object.keys(updateData).length === 0) {
                throw new Error("No threadId or runId provided to update.");
            }
            yield userDocRef.set(updateData, { merge: true });
            console.log(`Set fields for user ID ${userId}:`, updateData);
            return true;
        }
        catch (error) {
            console.error(`Error setting threadId or runId for user ID ${userId}:`, error);
            // throw error;
            return false;
        }
    });
}
function deleteThreadOrRunId(userId, options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = admin.firestore();
            const userDocRef = db.collection("user").doc(userId);
            // Build the update object based on options
            const updateData = {};
            if (options.threadId) {
                updateData.threadId = admin.firestore.FieldValue.delete();
            }
            if (options.runId) {
                updateData.runId = admin.firestore.FieldValue.delete();
            }
            if (Object.keys(updateData).length === 0) {
                throw new Error("No field specified to delete. Provide threadId and/or runId as true.");
            }
            // Use set with merge to avoid errors if fields do not exist
            yield userDocRef.set(updateData, { merge: true });
            console.log(`Deleted fields for user ID ${userId}:`, Object.keys(updateData).join(", "));
            return true;
        }
        catch (error) {
            console.error(`Error deleting threadId and/or runId for user ID ${userId}:`, error);
            // throw error;
            return false;
        }
    });
}
function createChat(threadId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = admin.firestore();
        const chatDocRef = db.collection("chat").doc(threadId);
        const now = admin.firestore.FieldValue.serverTimestamp();
        try {
            yield chatDocRef.set({
                userId: userId,
                createdAt: now,
                data: [],
            });
            console.log(`Chat document created for threadId ${threadId} and userId ${userId}`);
            return true;
        }
        catch (error) {
            console.error(`Error creating chat document for threadId ${threadId}:`, error);
            return false;
        }
    });
}
function insertConversationToChat(threadId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = admin.firestore();
        const chatDocRef = db.collection("chat").doc(threadId);
        try {
            yield chatDocRef.update({
                data: admin.firestore.FieldValue.arrayUnion({
                    role: data.role,
                    text: data.text,
                }),
            });
            console.log(`Inserted conversation data to chat ${threadId}: role=${data.role}, text=${data.text}`);
            return true;
        }
        catch (error) {
            console.error(`Error inserting conversation data to chat ${threadId}:`, error);
            return false;
        }
    });
}
function getChatDocumentById(threadId, option) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get a reference to the Firestore database
            const db = admin.firestore();
            // Get a reference to the specific document in the 'user' collection
            const chatDocRef = db.collection("chat").doc(threadId);
            // Fetch the document snapshot
            const chatDoc = yield chatDocRef.get();
            // Check if the document exists and return its data
            if (chatDoc.exists) {
                console.log((option === null || option === void 0 ? void 0 : option.showDebug)
                    ? `Document chat for threadId ${threadId}: ${chatDoc.data()}`
                    : `Document chat for threadId ${threadId} found`);
                return Object.assign(Object.assign({}, chatDoc.data()), { id: chatDoc.id });
                // return chatDoc.data();
            }
            else {
                console.log(`No document found for chat ID: ${threadId}`);
                return undefined;
            }
        }
        catch (error) {
            console.error(`Error getting chat document with ID ${threadId}:`, error);
            throw undefined; // Re-throw the error for further handling
        }
    });
}
function addSummaryToChat(threadId, summary) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const db = admin.firestore();
            const chatDocRef = db.collection("chat").doc(threadId);
            // Update the chat document with the summary field
            yield chatDocRef.set({
                summary: summary.text,
                summaryJson: (_a = summary.json) !== null && _a !== void 0 ? _a : null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            console.log(`Added summary to chat ${threadId}: ${summary}`);
            return true;
        }
        catch (error) {
            console.error(`Error adding summary to chat ${threadId}:`, error);
            return false;
        }
    });
}
function getChatDocumentsByUserId(userId, option) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const db = admin.firestore();
            const chatCollection = db.collection("chat");
            const querySnapshot = yield chatCollection
                .where("userId", "==", userId)
                .where("summaryJson", "!=", null)
                .orderBy("updatedAt", "desc")
                .limit((_a = option === null || option === void 0 ? void 0 : option.limit) !== null && _a !== void 0 ? _a : 5)
                .get();
            const docs = querySnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
            if (option === null || option === void 0 ? void 0 : option.showDebug) {
                console.log(`Fetched ${docs.length} chat documents for userId ${userId} with summaryJson not null`);
            }
            return docs;
        }
        catch (error) {
            console.error(`Error getting chat documents for userId ${userId} with summaryJson not null:`, error);
            return [];
        }
    });
}
//# sourceMappingURL=firebase_admin.js.map