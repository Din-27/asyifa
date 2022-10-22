import HyperExpress from "hyper-express";
import { Server, Socket } from "socket.io";
import { autoInjectable } from "tsyringe";
import { Queue } from "./model";
import { addQueueSchema } from "./schema";
import { PatientService } from "@/patient";
import { QueueService } from "./service";

@autoInjectable()
export class QueueHandler {
  constructor(private queueService: QueueService, private patientService: PatientService) {}

  socket = (_io: Server, _socket: Socket) => {};

  routes = (middlewares: HyperExpress.MiddlewareHandler[] = []) => {
    const r = new HyperExpress.Router();

    r.use("/queues", ...middlewares);
    r.get("/queues", this.getQueues);
    r.post("/queues", this.addQueue);
    r.get("/queue-types", this.getQueueTypes);
    r.post("/patients/:patientId/queues", this.addQueue);

    return r;
  };

  private addQueue: HyperExpress.UserRouteHandler = async (req, res) => {
    const requestBody = await req.json();

    if (req.path_parameters?.patientId) {
      requestBody.patientId = req.path_parameters.patientId;
    }

    const { error } = addQueueSchema.validate(requestBody);

    if (error) {
      res.status(400).json({
        status: false,
        data: null,
        error: error.message,
      });
      return;
    }

    try {
      const [patient, queueType] = await Promise.all([
        this.patientService.getPatient(requestBody.patientId),
        this.queueService.getQueueType(requestBody.typeId),
      ]);

      if (!patient) {
        res.status(400).json({
          status: false,
          data: null,
          error: "Patient not found",
        });

        return;
      }

      if (!queueType) {
        res.status(400).json({
          status: false,
          data: null,
          error: "Queue type not found",
        });

        return;
      }

      const queue: Queue = {
        id: "",
        bodyTemperature: requestBody.bodyTemperature,
        bloodPressure: {
          systolic: requestBody.bloodPressure.systolic,
          diastolic: requestBody.bloodPressure.diastolic,
        },
        type: {
          id: queueType.id,
          name: queueType.name,
        },
        patient: {
          id: patient.id,
          name: patient.name,
          dateOfBirth: patient.dateOfBirth,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.queueService.addQueue(queue);
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

  private getQueues: HyperExpress.UserRouteHandler = async (_req, res) => {
    try {
      const queues = await this.queueService.getQueues();

      res.json({
        status: true,
        data: queues,
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

  private getQueueTypes: HyperExpress.UserRouteHandler = async (_req, res) => {
    try {
      const queueTypes = await this.queueService.getQueueTypes();

      res.json({
        status: true,
        data: queueTypes,
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
}
