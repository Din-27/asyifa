import _ from "lodash";
import { CollectionReference, FieldValue } from "firebase-admin/firestore";
import { autoInjectable, inject, singleton } from "tsyringe";
import { Queue, QueueType } from "./model";
import { Nullable } from "@/common/utils/Nullable";

@singleton()
@autoInjectable()
export class QueueService {
  constructor(
    @inject("QueuesCollection") private queueCollection: CollectionReference,
    @inject("QueueTypesCollection") private queueTypeCollection: CollectionReference,
  ) {}

  addQueue = async (queue: Queue) => {
    const payload: any = {
      ...queue,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    delete payload.id;

    const docRef = await this.queueCollection.add(payload);

    return docRef.id;
  };

  getQueues = async (): Promise<Queue[]> => {
    const result = await this.queueCollection.orderBy("updatedAt", "desc").get();

    const queuesPromises = _.map(result.docs, async (doc) => {
      const data = doc.data();

      const queue: any = {
        ...data,
        id: doc.id,
        patient: {
          ...data?.patient,
          dateOfBirth: data?.patient?.dateOfBirth?.toDate?.(),
        },
        createdAt: data?.createdAt?.toDate?.(),
        updatedAt: data?.updatedAt?.toDate?.(),
      };

      return queue as Queue;
    });

    const queues = await Promise.all(queuesPromises);

    return queues;
  };

  getQueueType = async (id: string): Promise<Nullable<QueueType>> => {
    const doc = await this.queueTypeCollection.doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data();

    const queueType: any = {
      ...data,
      id: doc.id,
    };

    return queueType as QueueType;
  };

  getQueueTypes = async (): Promise<QueueType[]> => {
    const result = await this.queueTypeCollection.get();

    const queueTypes = _.map(result.docs, (doc) => {
      const data = doc.data();

      const queueType: any = {
        ...data,
        id: doc.id,
      };

      return queueType as QueueType;
    });

    return queueTypes;
  };
}
