import HyperExpress from "hyper-express";
import { autoInjectable } from "tsyringe";
import { AuthMiddleware } from "./middleware";
import { signInRequestSchema, refreshTokenRequestSchema } from "./schema";
import { AuthService } from "./service";
import paseto from 'paseto'
@autoInjectable()
export class AuthHandler {
  constructor(private authService: AuthService, public middleware: AuthMiddleware) {}

  routes = () => {
    const r = new HyperExpress.Router();

    r.post("/auth/signin", this.signIn);
    r.post("/auth/refresh-token", this.refreshToken);

    return r;
  };

  private signIn: HyperExpress.UserRouteHandler = async (req, res) => {
    const requestBody = await req.json();

    const { error } = signInRequestSchema.validate(requestBody);

    if (error) {
      res.status(400).json({
        status: false,
        data: null,
        error: error.message,
      });
      return;
    }

    try {
      const credential = await this.authService.signIn(requestBody.username, requestBody.password);

      res.json({
        status: true,
        data: credential,
        error: null,
      });
    } catch (error: any) {
      if (!error.httpStatusCode) console.error(error);

      res.status(error.httpStatusCode || 500).json({
        status: false,
        data: null,
        error: error.message,
      });
    }
  };

  private refreshToken: HyperExpress.UserRouteHandler = async (req, res) => {
    const requestBody = await req.json();

    const { error } = refreshTokenRequestSchema.validate(requestBody);

    if (error) {
      res.status(400).json({
        status: false,
        data: null,
        error: error.message,
      });
      return;
    }

    try {
      const credential = await this.authService.refreshToken(requestBody.refreshToken);

      res.json({
        status: true,
        data: credential,
        error: null,
      });
    } catch (error: any) {
      console.error(error);

      if (error instanceof paseto.errors.PasetoClaimInvalid) {
        error["httpStatusCode"] = 401;
      }

      res.status(error.httpStatusCode || 500).json({
        status: false,
        data: null,
        error: error.message,
      });
    }
  };
}
