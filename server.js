// "use strict";
// var __importDefault = (this && this.__importDefault) || function (mod) {
//     return (mod && mod.__esModule) ? mod : { "default": mod };
// };
// Object.defineProperty(exports, "__esModule", { value: true });
// const express_1 = __importDefault(require("express"));
// const node_fetch_1 = __importDefault(require("node-fetch"));
// const app = (0, express_1.default)();
// app.use(express_1.default.json());
// const DAILY_API_KEY = process.env.DAILY_API_KEY;
// if (!DAILY_API_KEY) {
//     throw new Error("Please set DAILY_API_KEY in your environment variables");
// }
// app.post("/create-room", async (req, res) => {
//     console.log("post");
//     const { caller, callee } = req.body;
//     try {
//         const response = await (0, node_fetch_1.default)("https://api.daily.co/v1/rooms", {
//             method: "POST",
//             headers: {
//                 Authorization: `Bearer ${DAILY_API_KEY}`,
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 properties: {
//                     exp: 3600, // room expires in 1 hour
//                     enable_knocking: false,
//                 },
//             }),
//         });
//         if (!response.ok) {
//             const text = await response.text();
//             return res.status(response.status).send(text);
//         }
//         const data = await response.json();
//         res.json({
//             roomUrl: data.url, // return the generated room URL
//         });
//     }
//     catch (error) {
//         console.error("Error creating room:", error);
//         res.status(500).json({ error: "Failed to create room" });
//     }
// });
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`Daily backend running on port ${PORT}`));
