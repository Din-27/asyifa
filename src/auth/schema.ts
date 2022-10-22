import Joi from "joi";

export const signInRequestSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
}).options({ allowUnknown: true });

export const refreshTokenRequestSchema = Joi.object({
  refreshToken: Joi.string().required(),
}).options({ allowUnknown: true });
