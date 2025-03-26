const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const url = process.env.MONGODB_URI;
const dbName = "my-website";

if (!url) {
  console.error("❌ MONGODB_URI is not defined. Check your environment variables.");
  process.exit(1);
}

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use("/images", express.static(path.join(__dirname, "public/images")));

const client = new MongoClient(url);

async function startServer() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    const db = client.db(dbName);
    const articlesCollection = db.collection("articles");
    const projectsCollection = db.collection("projects");
    const contactsCollection = db.collection("contacts");

    app.get("/articles", async (req, res) => {
      try {
        const articles = await articlesCollection.find({}).toArray();
        res.status(200).json(articles);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch articles", error: err.message });
      }
    });

    app.get("/articles/:id", async (req, res) => {
      try {
        const article = await articlesCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (article) res.status(200).json(article);
        else res.status(404).json({ message: "Article not found" });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch article", error: err.message });
      }
    });

    app.get("/projects", async (req, res) => {
      try {
        const projects = await projectsCollection.find({}).toArray();
        res.status(200).json(projects);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch projects", error: err.message });
      }
    });

    app.get("/projects/:id", async (req, res) => {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid project ID format" });
      }
      try {
        const project = await projectsCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (project) res.status(200).json(project);
        else res.status(404).json({ message: "Project not found" });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch project", error: err.message });
      }
    });

    app.get("/search", async (req, res) => {
      const { query } = req.query;
      if (!query) return res.status(400).json({ message: "Query parameter is required" });

      try {
        const results = await articlesCollection.find({
          $or: [
            { title: { $regex: query, $options: "i" } },
            { content: { $regex: query, $options: "i" } },
          ],
        }).toArray();
        res.status(200).json(results);
      } catch (err) {
        res.status(500).json({ message: "Failed to search articles", error: err.message });
      }
    });

    app.post("/contact", async (req, res) => {
      const { name, email, message } = req.body;
      if (!name || !email || !message) return res.status(400).json({ message: "All fields are required" });

      try {
        await contactsCollection.insertOne({ name, email, message, createdAt: new Date() });
        res.status(201).json({ message: "Message sent successfully!" });
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    app.get("/", (req, res) => {
      res.send("✅ Backend is running!");
    });

    app.use((req, res) => {
      res.status(404).json({ message: "Route not found" });
    });

    app.use((err, req, res, next) => {
      console.error("❌ Unexpected error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    });

    app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

startServer();
