import express from "express";
import {
  addComment,
  bookmarks,
  commentRules,
  createPost,
  createPostRules,
  followingFeed,
  listPosts,
  toggleBookmark,
  toggleFollow,
  toggleLike
} from "../controllers/postController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../utils/validators.js";

const router = express.Router();

router.get("/", protect, listPosts);
router.post("/", protect, createPostRules, validate, createPost);
router.get("/feed/following", protect, followingFeed);
router.get("/bookmarks/me", protect, bookmarks);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/bookmark", protect, toggleBookmark);
router.post("/:id/comments", protect, commentRules, validate, addComment);
router.post("/users/:userId/follow", protect, toggleFollow);

export default router;
