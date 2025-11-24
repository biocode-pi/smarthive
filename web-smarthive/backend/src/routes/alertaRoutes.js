import express from "express";
import { list, acknowledge } from "../controllers/alertaController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(auth);

router.get("/", list);
router.post("/:id/ack", acknowledge);

export default router;
