import argon2 from "@node-rs/argon2";
import { cpus } from "os";
import paseto from "paseto";
import tokenConfig from "@config/token";
import { User, UserService } from "@/user";
import { autoInjectable, singleton } from "tsyringe";
import { CasbinEnforcer } from "@/infrastructure/casbin";
import { CredentialUser, TokenPayload } from "./model";

const CORES = cpus().length;

type GenerateTokenProps = {
  user: User;
  expiration: string;
  secretKey: string;
};

@singleton()
@autoInjectable()
export class AuthService {
  constructor(private casbinEnforcer: CasbinEnforcer, private userService: UserService) {}

  private generateToken = async ({ user, secretKey, expiration }: GenerateTokenProps) => {
    const payload: TokenPayload = { id: user.id };
    const token = await paseto.V4.sign(payload, secretKey, { expiresIn: expiration });

    return token;
  };

  private generateAccessToken = async (user: User) => {
    if (!tokenConfig.accessToken.secretKey) {
      throw new Error("Private key for access token is not set");
    }

    return this.generateToken({
      user,
      secretKey: tokenConfig.accessToken.secretKey,
      expiration: tokenConfig.accessToken.expiration,
    });
  };

  private generateRefreshToken = async (user: User) => {
    if (!tokenConfig.refreshToken.secretKey) {
      throw new Error("Private key for refresh token is not set");
    }

    return this.generateToken({
      user,
      secretKey: tokenConfig.refreshToken.secretKey,
      expiration: tokenConfig.refreshToken.expiration,
    });
  };

  private verifyPassword = async (password: string, hash: string) => {
    const isPasswordValid = await argon2.verify(hash, password, {
      parallelism: CORES,
    });

    return isPasswordValid;
  };

  private verifyToken = async (token: string, publicKey: string): Promise<TokenPayload> => {
    const { payload } = await paseto.V4.verify(token, publicKey, { complete: true });

    return payload as TokenPayload;
  };

  public verifyAccessToken = async (token: string) => {
    if (!tokenConfig.accessToken.publicKey) {
      throw new Error("Public key for access token is not set");
    }

    return this.verifyToken(token, tokenConfig.accessToken.publicKey);
  };

  public verifyRefreshToken = async (token: string) => {
    if (!tokenConfig.refreshToken.publicKey) {
      throw new Error("Public key for refresh token is not set");
    }

    return this.verifyToken(token, tokenConfig.refreshToken.publicKey);
  };

  public refreshToken = async (refreshToken: string): Promise<CredentialUser> => {
    const tokenPayload: TokenPayload = await this.verifyRefreshToken(refreshToken);

    const user = await this.userService.getUserById(tokenPayload?.id);

    if (!user) {
      throw new Error("User not found");
    }

    const [accessToken, newRefreshToken, roles] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
      this.getRolesByUser(user),
    ]);

    return {
      id: user.id,
      username: user.username,
      accessToken,
      refreshToken: newRefreshToken,
      roles,
    };
  };

  public getRolesByUser = async (user: User) => {
    const enforcer = await this.casbinEnforcer.getEnforcer();
    const roles = await enforcer.getRolesForUser(user.id);
    return roles;
  };

  public signIn = async (username: string, password: string): Promise<CredentialUser> => {
    const user = await this.userService.getUserByUsername(username);

    if (!user) {
      const e: any = new Error("Invalid username or password");
      e.httpStatusCode = 401;
      throw e;
    }

    if (!user?.password) {
      throw new Error("User password not found, please contact admin to reset your password");
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      const e: any = new Error("Invalid username or password");
      e.httpStatusCode = 401;
      throw e;
    }

    const [accessToken, refreshToken, roles] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
      this.getRolesByUser(user),
    ]);

    return {
      id: user.id,
      username,
      accessToken,
      refreshToken,
      roles,
    };
  };
}
