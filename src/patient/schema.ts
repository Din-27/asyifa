import Joi from "joi";

export const addPatientRequestSchema = Joi.object({
  name: Joi.string().min(2).required(),
  gender: Joi.number().valid(1, 2).required(),
  dateOfBirth: Joi.date().iso().required(),
  address: Joi.string().min(4).required(),
  phone: Joi.string().allow(null, ""),
  bodyHeight: Joi.number().required(),
  bodyWeight: Joi.number().required(),
}).options({ allowUnknown: true });

export const updatePatientRequestSchema = Joi.object({
  name: Joi.string().min(2),
  gender: Joi.number().valid(1, 2),
  dateOfBirth: Joi.date().iso(),
  address: Joi.string().min(4),
  phone: Joi.string().allow(null, ""),
  bodyHeight: Joi.number(),
  bodyWeight: Joi.number(),
}).options({ allowUnknown: true });
