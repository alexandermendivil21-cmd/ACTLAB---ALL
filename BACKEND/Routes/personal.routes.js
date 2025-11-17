import express from "express";
import {
  getPersonal,
  getPersonalById,
  createPersonal,
  updatePersonal,
  deletePersonal
} from "../controllers/personal.controller.js";

const router = express.Router();

router.get("/personal", getPersonal);
router.get("/personal/:id", getPersonalById);
router.post("/personal", createPersonal);
router.put("/personal/:id", updatePersonal);
router.delete("/personal/:id", deletePersonal);

export default router;

