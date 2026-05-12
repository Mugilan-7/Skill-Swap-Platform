import express from "express";
import { dashboard, listUsers, recommendations, updateProfile, updateProfileRules } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { validate } from "../utils/validators.js";

const router = express.Router();

router.get("/", protect, listUsers);
router.get("/dashboard", protect, dashboard);
router.get("/recommendations", protect, recommendations);
router.put("/me", protect, upload.single("profilePicture"), updateProfileRules, validate, updateProfile);

export default router;
