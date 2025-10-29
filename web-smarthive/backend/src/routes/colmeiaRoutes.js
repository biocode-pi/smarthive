import express from "express";
import { list, create, update, remove } from "../controllers/colmeiaController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(auth);

router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
