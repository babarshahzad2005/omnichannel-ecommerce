import { Router, type NextFunction, type Request, type Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import * as authService from "../services/auth.service";
import {
  accessTokenCookieOptions,
  clearCookieOptions,
  refreshTokenCookieOptions,
} from "../utils/cookies";
import { AppError } from "../utils/errors";

const router = Router();

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      data: errors.array(),
    });
    return;
  }

  next();
};

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

const handleRouteError = (
  err: unknown,
  res: Response,
  fallbackMessage: string
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { user, tokens } = await authService.register({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
      });

      setAuthCookies(res, tokens);

      res.status(201).json({
        success: true,
        data: user,
        message: "Registration successful",
      });
    } catch (err) {
      handleRouteError(err, res, "Registration failed");
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { user, tokens } = await authService.login(
        req.body.email,
        req.body.password
      );

      setAuthCookies(res, tokens);

      res.json({
        success: true,
        data: user,
        message: "Login successful",
      });
    } catch (err) {
      handleRouteError(err, res, "Login failed");
    }
  }
);

router.post("/refresh", async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
    return;
  }

  try {
    const tokens = await authService.refreshTokens(refreshToken);
    setAuthCookies(res, tokens);

    res.json({
      success: true,
      message: "Tokens refreshed successfully",
    });
  } catch (err) {
    handleRouteError(err, res, "Token refresh failed");
  }
});

router.post("/logout", authenticate, async (req: Request, res: Response) => {
  try {
    await authService.logout(req.user!.id);
    clearAuthCookies(res);

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (err) {
    handleRouteError(err, res, "Logout failed");
  }
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await authService.getCurrentUser(req.user!.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    handleRouteError(err, res, "Failed to fetch user profile");
  }
});

export default router;
