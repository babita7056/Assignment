import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import postsRouter from "./posts.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(statsRouter);

export default router;
