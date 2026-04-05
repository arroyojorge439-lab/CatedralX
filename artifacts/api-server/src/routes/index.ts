import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import vitalsRouter from "./vitals";
import signalsRouter from "./signals";
import paperTradingRouter from "./paperTrading";
import nervousRouter from "./nervous";
import gitRouter from "./git";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(vitalsRouter);
router.use(signalsRouter);
router.use(paperTradingRouter);
router.use(nervousRouter);
router.use(gitRouter);
router.use(aiRouter);

export default router;
