const express = require("express");
const router = express.Router();
const passport = require("passport");
const Post = require("../models/post");
const User = require("../models/user");
const { registerUser, generateAndSendOTP } = require("../config/passport");

// Login form page
router.get("/login", (req, res) => {
  res.render("login");
});

// Register form page
router.get("/", (req, res) => {
  res.render("register");
});

// Handle user registration
router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Register the new user
    const result = await registerUser(name, email, password);
    
    if (result.error) {
      return res.status(400).render("register", { error: result.error });
    }
    
    // Store email in session for OTP verification
    req.session.email = email;
    
    // Generate and send OTP to the user's email
    await generateAndSendOTP(email);
    
    // Redirect to OTP verification page
    res.redirect('/verify-otp');
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).render("register", { error: "Server error" });
  }
});

// Handle login
router.post("/login", (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.render('login', { error: info.message || 'Invalid credentials' });
    }
    
    // Check if the user has verified their email
    if (!user.isVerified) {
      // Store email in session for OTP verification
      req.session.email = user.email;
      
      // Generate and send a new OTP
      generateAndSendOTP(user.email);
      
      return res.redirect('/verify-otp');
    }
    
    // Log in the user if they're verified
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      
      // Redirect to dashboard
      return res.redirect("/dashboard");
    });
  })(req, res, next);
});

// OTP verification page
router.get("/verify-otp", (req, res) => {
  if (!req.session.email) {
    return res.redirect("/login");
  }
  res.render("verify-otp", { email: req.session.email });
});

// Handle OTP verification
router.post("/verify-otp", (req, res, next) => {
  if (!req.session.email) {
    return res.redirect("/login");
  }
  
  // Add email from session to req.body for passport
  req.body.email = req.session.email;
  
  passport.authenticate('otp-verify', (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.render('verify-otp', { 
        email: req.session.email, 
        error: info.message || 'Invalid or expired OTP' 
      });
    }
    
    // Mark user as verified
    user.isVerified = true;
    user.save().then(() => {
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Clear the email from session
        delete req.session.email;
        
        // Redirect to dashboard
        return res.redirect("/dashboard");
      });
    }).catch(err => {
      console.error("Error saving user verification:", err);
      return next(err);
    });
  })(req, res, next);
});

// Resend OTP
router.post("/resend-otp", async (req, res, next) => {
  if (!req.session.email) {
    return res.redirect("/login");
  }
  
  try {
    // Generate and send new OTP
    await generateAndSendOTP(req.session.email);
    
    // Redirect back to OTP verification page
    res.redirect('/verify-otp');
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.render('verify-otp', { 
      email: req.session.email, 
      error: 'Failed to send OTP. Please try again.'
    });
  }
});

// POST route for uploading tasks with user association
router.post("/upload", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }
  try {
    const userId = req.user._id || req.user.id; // Use the available property
    const newPost = new Post({
      title: req.body.title,
      message: req.body.message,
      user: userId,
    });
    await newPost.save();
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).send("Server error");
  }
});

// Protected Dashboard Route to display user-specific posts
router.get("/dashboard", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }
  try {
    const userId = req.user._id || req.user.id; // Use the same identifier here
    const posts = await Post.find({ user: userId });
    res.render("dashboard", { posts });
  } catch (error) {
    console.error("Dashboard error:", error); 
    res.status(500).send("Server error");
  }
});

// Delete Route for deleting a task
router.post("/delete/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  
  // Add validation for ID
  if (!req.params.id || req.params.id === "null" || req.params.id === "undefined") {
    return res.status(400).send("Invalid post ID");
  }
  
  try {
    // Check that user ID is valid
    if (!req.user || !req.user._id) {
      return res.status(401).send("User session error");
    }
    
    // Find the post belonging to the current user
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });
    if (!post) {
      return res.status(404).send("Post not found or unauthorized");
    }
    await post.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).send("Server error");
  }
});

// Update Route for updating a task
router.post("/update/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user._id });
    if (!post) {
      return res.status(404).send("Post not found or unauthorized");
    }
    post.title = req.body.title;
    post.message = req.body.message;
    await post.save();
    res.json({ success: true, post });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).send("Server error");
  }
});

// Logout Route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.redirect("/login");
    });
  });
});

module.exports = router;