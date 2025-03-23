const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection URL and Database Name
const url = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/my-website";
const dbName = "my-website";

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(express.static(path.join(__dirname, "../client/build")));
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Create MongoDB Client and Connect
const client = new MongoClient(url);

async function startServer() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    console.log(`✅ Using database: ${dbName}`);

    const db = client.db(dbName);
    const articlesCollection = db.collection("articles");
    const projectsCollection = db.collection("projects");

    // Route to get all articles
    app.get("/articles", async (req, res) => {
      try {
        const articles = await articlesCollection.find({}).toArray();
        res.status(200).json(articles);
      } catch (err) {
        console.error("Error fetching articles:", err);
        res.status(500).json({ message: "Failed to fetch articles", error: err.message });
      }
    });

    // Route to get a single article by ID
    app.get("/articles/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const article = await articlesCollection.findOne({ _id: new ObjectId(id) });
        if (article) {
          res.status(200).json(article);
        } else {
          res.status(404).json({ message: "Article not found" });
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        res.status(500).json({ message: "Failed to fetch article", error: err.message });
      }
    });

    // Route to get all projects
    app.get("/projects", async (req, res) => {
      try {
        const projects = await projectsCollection.find({}).toArray();
        res.status(200).json(projects);
      } catch (err) {
        console.error("Error fetching projects:", err);
        res.status(500).json({ message: "Failed to fetch projects", error: err.message });
      }
    });

    // Route to get a single project by ID
    app.get("/projects/:id", async (req, res) => {
      const { id } = req.params;
      console.log("🛠 Requested Project ID:", id);

      if (!ObjectId.isValid(id)) {
        console.log("❌ Invalid ObjectId format:", id);
        return res.status(400).json({ message: "Invalid project ID format" });
      }

      try {
        const project = await projectsCollection.findOne({ _id: new ObjectId(id) });

        if (!project) {
          console.log("❌ Project not found in DB for ID:", id);
          return res.status(404).json({ message: "Project not found" });
        }

        console.log("✅ Project Found:", project);
        res.status(200).json(project);
      } catch (err) {
        console.error("❌ Error fetching project:", err);
        res.status(500).json({ message: "Failed to fetch project", error: err.message });
      }
    });

    // Search route
    app.get("/search", async (req, res) => {
      const { query } = req.query;
      console.log("Search Query:", query);

      try {
        const titleResults = await articlesCollection
          .find({ title: { $regex: query, $options: "i" } })
          .toArray();

        console.log("Title Results:", titleResults);

        if (titleResults.length > 0) {
          return res.status(200).json(titleResults);
        }

        const contentResults = await articlesCollection
          .find({ content: { $regex: query, $options: "i" } })
          .toArray();

        console.log("Content Results:", contentResults);

        if (contentResults.length > 0) {
          return res.status(200).json(contentResults);
        }

        console.log("No results found for query:", query);
        res.status(200).json([]);
      } catch (err) {
        console.error("Error searching articles:", err);
        res.status(500).json({ message: "Failed to search articles", error: err.message });
      }
    });

    // Contact page route
    app.post("/contact", async (req, res) => {
      try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
          return res.status(400).json({ message: "All fields are required" });
        }

        const contactsCollection = db.collection("contacts");
        const newContact = { name, email, message, createdAt: new Date() };
        await contactsCollection.insertOne(newContact);

        res.status(201).json({ message: "Message sent successfully!" });
      } catch (err) {
        console.error("❌ Error saving contact message:", err);
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    // Serve React App for undefined routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../client/build", "index.html"));
    });

    // Catch-all error handler
    app.use((err, req, res, next) => {
      console.error("❌ Unexpected error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    });

    // Start Express Server
    app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

// Start the server
startServer();