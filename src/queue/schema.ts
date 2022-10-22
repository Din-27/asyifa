import Joi from "joi";

export const addQueueSchema = Joi.object({
  bodyTemperature: Joi.number().required(),
  bloodPressure: Joi.object({
    systolic: Joi.number().required(),
    diastolic: Joi.number().required(),
  }).required(),
  typeId: Joi.string().required(),
  patientId: Joi.string().required(),
}).options({ allowUnknown: true });
