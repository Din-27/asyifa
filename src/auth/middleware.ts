import HyperExpress from "hyper-express";
import paseto from "paseto";
import { autoInjectable } from "tsyringe";
import { AuthService } from "./service";

@autoInjectable()
export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  verifyAccessToken: HyperExpress.MiddlewareHandler = async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "No token provided!" });
      return;
    }

    try {
      const tokenPayload = await this.authService.verifyAccessToken(token);

      if (!tokenPayload) {
        throw new Error("Invalid token");
      }

      return;
    } catch (error: any) {
      if (!(error instanceof paseto.errors.PasetoError)) {
        console.error({ error });
      }

      let message = error.message || "Unauthorized!";

      res.status(401).json({ message });
      return;
    }
  };
}
