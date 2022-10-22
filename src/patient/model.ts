// domain of Patient
export type Patient = {
  id: string;
  patientNumber: string;
  name: string;
  gender: number;
  dateOfBirth: Date;
  address: string;
  phone: string;
  bodyHeight: number;
  bodyWeight: number;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
};
