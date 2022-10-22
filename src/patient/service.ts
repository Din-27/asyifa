import _ from "lodash";
import { CollectionReference, FieldValue } from "firebase-admin/firestore";
import { autoInjectable, inject, singleton } from "tsyringe";
import parsePhoneNumber from "libphonenumber-js";
import { Patient } from "./model";
import { nanoidNumberOnly } from "@/common/utils/nanoidNumberOnly";
import { Nullable } from "@/common/utils/Nullable";

@singleton()
@autoInjectable()
export class PatientService {
  constructor(@inject("PatientsCollection") private patientsCollection: CollectionReference) {}

  private generatePatientNumber = async (): Promise<string> => {
    let patientNumberToReturn = nanoidNumberOnly(24);

    for (let i = 0; i < 5; i++) {
      // generate patient number
      const patientNumber = nanoidNumberOnly(8 + i);
      const docs = await this.patientsCollection
        .select("patientNumber")
        .where("patientNumber", "==", patientNumber)
        .get();

      if (docs.empty) {
        patientNumberToReturn = patientNumber;
        break;
      }
    }

    return "P" + patientNumberToReturn;
  };

  getPatient = async (id: string): Promise<Nullable<Patient>> => {
    const doc = await this.patientsCollection.doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data();
    const patient = {
      ...data,
      id: doc.id,
      dateOfBirth: data?.dateOfBirth?.toDate?.(),
      lastActive: data?.lastActive?.toDate?.(),
      createdAt: data?.createdAt?.toDate?.(),
      updatedAt: data?.updatedAt?.toDate?.(),
    };

    return patient as Patient;
  };

  getPatients = async (): Promise<Patient[]> => {
    const result = await this.patientsCollection
      .select("name", "dateOfBirth", "address")
      .orderBy("name", "asc")
      .get();

    const patients = _.map(result.docs, (doc) => {
      const docData = doc.data();
      const patient = {
        ...docData,
        id: doc.id,
        dateOfBirth: docData?.dateOfBirth?.toDate?.(),
      };

      return patient as Patient;
    });

    return patients;
  };

  addPatient = async (patient: Patient) => {
    // format phone number
    const parsedPhoneNumber = parsePhoneNumber(patient.phone, "ID");
    if (parsedPhoneNumber?.isValid?.()) {
      patient.phone = parsedPhoneNumber.number;
    }

    const payload: any = {
      ...patient,
      patientNumber: await this.generatePatientNumber(),
      lastActive: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    delete payload.id;

    const docRef = await this.patientsCollection.add(payload);

    return docRef.id;
  };

  updatePatient = async (patient: Patient): Promise<Patient> => {
    const parsedPhoneNumber = parsePhoneNumber(patient.phone, "ID");
    if (parsedPhoneNumber?.isValid?.()) {
      patient.phone = parsedPhoneNumber.number;
    }

    const payload: any = {
      ...patient,
      updatedAt: FieldValue.serverTimestamp(),
    };

    delete payload.id;

    const doc = await this.patientsCollection.doc(patient.id).update(payload);

    patient.updatedAt = doc.writeTime.toDate();

    return patient;
  };

  removePatient = async (id: string): Promise<void> => {
    await this.patientsCollection.doc(id).delete();
  };
}
