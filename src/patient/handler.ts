import { Nullable } from "@/common/utils/Nullable";
import HyperExpress from "hyper-express";
import { autoInjectable } from "tsyringe";
import { Optional } from "utility-types";
import { Patient } from "./model";
import { addPatientRequestSchema, updatePatientRequestSchema } from "./schema";
import { PatientService } from "./service";

@autoInjectable()
export class PatientHandler {
  constructor(private patientService: PatientService) {}

  routes = (middlewares: HyperExpress.MiddlewareHandler[] = []) => {
    const r = new HyperExpress.Router();

    r.use("/patients", ...middlewares);
    r.get("/patients", this.getPatients);
    r.get("/patients/:id", this.getPatient);
    r.post("/patients", this.addPatient);
    r.patch("/patients/:id", this.updatePatient);
    r.delete("/patients/:id", this.removePatient);

    return r;
  };

  private addPatient: HyperExpress.UserRouteHandler = async (req, res) => {
    const requestBody = await req.json();

    const { error } = addPatientRequestSchema.validate(requestBody);

    if (error) {
      res.status(400).json({
        status: false,
        data: null,
        error: error.message,
      });
      return;
    }

    const patient: Patient = {
      id: "",
      patientNumber: "",
      name: requestBody.name,
      gender: requestBody.gender,
      dateOfBirth: new Date(requestBody.dateOfBirth),
      address: requestBody.address,
      phone: requestBody.phone || "",
      bodyHeight: requestBody.bodyHeight,
      bodyWeight: requestBody.bodyWeight,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const result = await this.patientService.addPatient(patient);
      res.status(201).json({
        status: true,
        data: result,
        error: null,
      });
    } catch (error: any) {
      console.error(error);

      res.status(error.httpStatusCode || 500).json({
        status: false,
        data: null,
        error: error.message,
      });
    }
  };

  private getPatients: HyperExpress.UserRouteHandler = async (_req, res) => {
    try {
      const patients = await this.patientService.getPatients();

      res.json({
        status: true,
        data: patients,
        error: null,
      });
    } catch (error: any) {
      console.error(error);

      res.status(error.httpStatusCode || 500).json({
        status: false,
        data: [],
        error: error.message,
      });
    }
  };

  private getPatient: HyperExpress.UserRouteHandler = async (req, res) => {
    try {
      const patient: Nullable<Optional<Patient, "createdAt" | "updatedAt">> =
        await this.patientService.getPatient(req.path_parameters.id!);

      if (!patient) {
        res.status(404).json({
          status: false,
          data: null,
          error: "Patient not found",
        });
        return;
      }

      delete patient?.updatedAt;
      delete patient?.createdAt;

      res.json({
        status: true,
        data: patient,
        error: null,
      });
    } catch (error: any) {
      console.error(error);

      res.status(error.httpStatusCode || 500).json({
        status: false,
        data: null,
        error: error.message,
      });
    }
  };

  private updatePatient: HyperExpress.UserRouteHandler = async (req, res) => {
    const requestBody = await req.json();

    const { error } = updatePatientRequestSchema.validate(requestBody);

    if (error) {
      res.status(400).json({
        status: false,
        data: null,
        error: error.message,
      });
      return;
    }

    try {
      const patient = await this.patientService.getPatient(req.path_parameters.id!);

      if (!patient) {
        res.status(404).json({
          status: false,
          data: null,
          error: "Patient not found",
        });
        return;
      }

      patient.name = requestBody.name || patient.name;
      patient.gender = requestBody.gender || patient.gender;
      patient.dateOfBirth = new Date(requestBody.dateOfBirth || patient.dateOfBirth);
      patient.address = requestBody.address || patient.address;
      patient.phone = requestBody.phone ?? patient.phone;
      patient.bodyHeight = requestBody.bodyHeight || patient.bodyHeight;
      patient.bodyWeight = requestBody.bodyWeight || patient.bodyWeight;
      patient.updatedAt = new Date();

      const result = await this.patientService.updatePatient(patient);

      res.json({
        status: true,
        data: result,
        error: null,
      });
    } catch (error: any) {
      console.error(error);

      res.status(error.httpStatusCode || 500).json({
        status: false,
        data: null,
        error: error.message,
      });
    }
  };

  private removePatient: HyperExpress.UserRouteHandler = async (req, res) => {
    try {
      const patient = await this.patientService.getPatient(req.path_parameters.id!);

      if (!patient) {
        res.status(404).json({
          status: false,
          data: null,
          error: "Patient not found",
        });
        return;
      }

      await this.patientService.removePatient(patient.id);

      res.json({
        status: true,
        data: "Patient removed successfully",
        error: null,
      });
    } catch (error: any) {
      console.error(error);

      res.status(error.httpStatusCode || 500).json({
        status: false,
        data: null,
        error: error.message,
      });
    }
  };
}
