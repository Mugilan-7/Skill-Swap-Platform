import { body } from "express-validator";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../utils/notifications.js";

const populatePost = [
  { path: "user", select: "name email profilePicture category skillsOffered followers following" },
  { path: "comments.user", select: "name profilePicture" }
];

function parseTags(tags) {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
  return String(tags || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export const createPostRules = [
  body("title").trim().isLength({ min: 2, max: 120 }).withMessage("Title must be 2-120 characters"),
  body("content").trim().isLength({ min: 2 }).withMessage("Content is required"),
  body("tags").optional()
];

export const commentRules = [
  body("text").trim().isLength({ min: 1, max: 500 }).withMessage("Comment must be 1-500 characters")
];

export const createPost = asyncHandler(async (req, res) => {
  const post = await Post.create({
    user: req.user._id,
    title: req.body.title,
    content: req.body.content,
    tags: parseTags(req.body.tags)
  });

  res.status(201).json(await post.populate(populatePost));
});

export const listPosts = asyncHandler(async (req, res) => {
  const { tag, search, sort = "latest" } = req.query;
  const query = {};

  if (tag) query.tags = String(tag).toLowerCase();
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } }
    ];
  }

  const posts = await Post.find(query)
    .populate(populatePost)
    .sort({ createdAt: sort === "oldest" ? 1 : -1 })
    .limit(100);

  res.json(posts);
});

export const followingFeed = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("following");
  const posts = await Post.find({ user: { $in: user.following } })
    .populate(populatePost)
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(posts);
});

export const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const alreadyLiked = post.likes.some((id) => String(id) === String(req.user._id));
  post.likes = alreadyLiked ? post.likes.filter((id) => String(id) !== String(req.user._id)) : [...post.likes, req.user._id];
  await post.save();

  if (!alreadyLiked) {
    await createNotification(req.app.get("io"), {
      user: post.user,
      type: "like",
      title: "New post like",
      body: `${req.user.name} liked your post`,
      link: "/feed"
    });
  }

  res.json(await post.populate(populatePost));
});

export const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  post.comments.push({ user: req.user._id, text: req.body.text });
  await post.save();

  await createNotification(req.app.get("io"), {
    user: post.user,
    type: "comment",
    title: "New post comment",
    body: `${req.user.name} commented on your post`,
    link: "/feed"
  });

  res.status(201).json(await post.populate(populatePost));
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const user = await User.findById(req.user._id);
  const bookmarked = user.bookmarks.some((id) => String(id) === String(post._id));
  user.bookmarks = bookmarked ? user.bookmarks.filter((id) => String(id) !== String(post._id)) : [...user.bookmarks, post._id];
  await user.save();

  if (!bookmarked) {
    await createNotification(req.app.get("io"), {
      user: post.user,
      type: "bookmark",
      title: "Post bookmarked",
      body: `${req.user.name} bookmarked your post`,
      link: "/feed"
    });
  }

  res.json({ bookmarks: user.bookmarks });
});

export const bookmarks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: "bookmarks", populate: populatePost });
  res.json(user.bookmarks);
});

export const toggleFollow = asyncHandler(async (req, res) => {
  if (String(req.user._id) === String(req.params.userId)) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  const [me, target] = await Promise.all([User.findById(req.user._id), User.findById(req.params.userId)]);
  if (!target) return res.status(404).json({ message: "User not found" });

  const follows = me.following.some((id) => String(id) === String(target._id));
  if (follows) {
    me.following = me.following.filter((id) => String(id) !== String(target._id));
    target.followers = target.followers.filter((id) => String(id) !== String(me._id));
  } else {
    me.following.push(target._id);
    target.followers.push(me._id);
    await createNotification(req.app.get("io"), {
      user: target._id,
      type: "follow",
      title: "New follower",
      body: `${me.name} followed you`,
      link: "/feed"
    });
  }

  await Promise.all([me.save(), target.save()]);
  res.json({ following: me.following, followers: target.followers });
});
