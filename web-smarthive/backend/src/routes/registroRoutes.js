import express from "express";
import { list, create, simulate } from "../controllers/registroController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(auth);

router.get("/", list);
router.post("/", create);
router.post("/simulate", simulate);

export default router;
