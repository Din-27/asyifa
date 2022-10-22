import "dotenv/config";
import "reflect-metadata";
import HyperExpress from "hyper-express";
import { Server } from "socket.io";
import { connectToFirestore } from "@/infrastructure/firestore";
import { AuthHandler } from "@/auth";
import { PatientHandler } from "@/patient";
import { QueueHandler } from "@/queue";
import { container } from "tsyringe";

const main = async () => {
  try {
    const firestore = connectToFirestore();

    container.register("Firestore", { useValue: firestore });
    container.register("PoliciesCollection", { useValue: firestore.collection("Policies") });
    container.register("UsersCollection", { useValue: firestore.collection("Users") });
    container.register("PatientsCollection", { useValue: firestore.collection("Patients") });
    container.register("QueuesCollection", { useValue: firestore.collection("Queues") });
    container.register("QueueTypesCollection", { useValue: firestore.collection("QueueTypes") });

    const authHandler = container.resolve(AuthHandler);
    const patientHandler = container.resolve(PatientHandler);
    const queueHandler = container.resolve(QueueHandler);

    const app = new HyperExpress.Server();
    const io = new Server();
    const port = Number(process.env.PORT) || 3000;

    io.attachApp(app.uws_instance);
    io.on("connection", (socket) => {
      queueHandler.socket(io, socket);
    });

    app.use("/api", authHandler.routes());
    app.use("/api", patientHandler.routes([authHandler.middleware.verifyAccessToken]));
    app.use("/api", queueHandler.routes([authHandler.middleware.verifyAccessToken]));

    await app.listen(port);
    console.log("Listening to port " + port);
  } catch (error) {
    console.error(error);
    console.error("Failed to start server");
    process.exit(1);
  }
};

main();
