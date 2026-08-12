import { Router, type NextFunction, type Request, type Response } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as authService from "../services/auth.service";
import { ApiError } from "../utils/ApiError";
import { success } from "../utils/apiResponse";
import {
  accessTokenCookieOptions,
  clearCookieOptions,
  refreshTokenCookieOptions,
} from "../utils/cookies";

const router = Router();

const setAuthCookies = (
  res: Response,
  tokens: authService.AuthTokens
): void => {
  res.cookie("accessToken", tokens.accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", tokens.refreshToken, refreshTokenCookieOptions);
};

const clearAuthCookies = (res: Response): void => {
  res.clearCookie("accessToken", clearCookieOptions);
  res.clearCookie("refreshToken", clearCookieOptions);
};

router.post(
  "/register",
  ...validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, tokens } = await authService.register({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      });

      setAuthCookies(res, tokens);
      success(res, user, 201);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  ...validate([
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, tokens } = await authService.login(
        req.body.email,
        req.body.password
      );

      setAuthCookies(res, tokens);
      success(res, user);
    } catch (err) {
      next(err);
    }
  }
);

router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }

    const tokens = await authService.refreshTokens(refreshToken);
    setAuthCookies(res, tokens);
    success(res, { refreshed: true });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/logout",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req.user!.id);
      clearAuthCookies(res);
      success(res, { loggedOut: true });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getCurrentUser(req.user!.id);
      success(res, user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
