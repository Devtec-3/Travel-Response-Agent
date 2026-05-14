import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import tripsRouter from "./trips";
import agentsRouter from "./agents";
import notificationsRouter from "./notifications";
import walletRouter from "./wallet";
import itinerariesRouter from "./itineraries";
import anthropicRouter from "./anthropic/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(tripsRouter);
router.use(agentsRouter);
router.use(notificationsRouter);
router.use(walletRouter);
router.use(itinerariesRouter);
router.use(anthropicRouter);

export default router;
