const express = require("express");
const Groq = require("groq-sdk");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();
app.use(cors({
  origin : "https://skc-frontend.vercel.app/ask",
  methods: ['GET', 'POST'],  
  allowedHeaders: ['Content-Type', 'Authorization'],  
}));
app.use(express.json());

const port = 5000;
const QUIZ_API_KEY = process.env.QUIZ_API_KEY;

app.get("/", (req, res) => {
  res.send("Skool Of Code Backend!");
});

// Endpoint to fetch Python quiz questions
app.get("/quiz", async (req, res) => {
  try {
    const response = await axios.get("https://quizapi.io/api/v1/questions", {
      headers: { "X-Api-Key": QUIZ_API_KEY },
      params: {
        category: "code",
        tags: "Javascript",
        limit: 10,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    res.status(500).json({ error: "Failed to fetch quiz questions" });
  }
});

// Chatbot endpoint
app.post("/ask", async (req, res) => {
  try {
    const userQuestion = req.body.question;
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: userQuestion }],
      model: "llama-3.3-70b-versatile",
    });

    let answer = chatCompletion.choices[0]?.message?.content || "";

    // Determine if response is code or text
    let answerType = answer.includes("```") ? "code" : "text";

    // Extract code if present
    if (answerType === "code") {
      const match = answer.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
      answer = match ? match[1] : answer;
    }

    res.json({ answer, answerType });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong!" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
