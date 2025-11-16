import express, { Request, Response } from "express";
import dotenv from "dotenv";
import fetch from "node-fetch"; 
import cors from "cors";
// Load environment variables from .env file
dotenv.config();

// --- Configuration and Type Safety ---

const DAILY_API_KEY = process.env.DAILY_API_KEY;

// Ensure API key is present before starting the server
if (!DAILY_API_KEY) {
  throw new Error("DAILY_API_KEY environment variable is not set.");
}

// Type for incoming request body
interface CreateRoomRequest {
  caller?: string;
  callee?: string;
}

// Type for response from Daily.co API (use strict interface for safety)
interface DailyRoomResponse {
  id: string;
  name: string;
  url: string;
  // Add other key properties you might use here
  // [key: string]: any; // Removed this index signature for cleaner typing, add if needed.
}

// --- Express App Setup ---

const app = express();
app.use(express.json());
app.use(cors())
// --- API Route ---

// Use a specific Request type that includes the expected body structure
app.get("/create-room", async (req: Request<{}, {}, CreateRoomRequest>, res: Response) => {
  // const { caller, callee } = req.body; // Destructure the expected values, though not used in Daily API call here
  try {
      
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Default Daily room properties
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600, // Room expires in 1 hour (as Unix timestamp)
          enable_knocking: false,
          enable_prejoin_ui: false,
        },
      }),
    });

    if (!response.ok) {
      // Read the response text for detailed error logging/sending
      const errorText = await response.text();
      console.error("Daily API Error:", errorText);
      return res.status(response.status).send(`Failed to create room: ${errorText}`);
    }

    // Use type assertion for the JSON response
    const data = await response.json() as DailyRoomResponse; 

    // Send back the room URL to the client
    res.json({
      roomUrl: data.url, 
    });

  } catch (error) {
    console.error("Error creating room:", error);
    // Use a clearer type guard for the error object if possible, or just stringify
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: `Failed to create room: ${errorMessage}` });
  }
});

// --- Server Startup ---

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Daily backend running on port ${PORT}`);
});