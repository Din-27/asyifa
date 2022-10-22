export type QueueType = {
  id: string;
  name: string;
};

export type QueuePatient = {
  id: string;
  name: string;
  dateOfBirth: Date;
};

export type BloodPressure = {
  systolic: number;
  diastolic: number;
};

export type Queue = {
  id: string;
  type: QueueType;
  patient: QueuePatient;
  bloodPressure: BloodPressure;
  bodyTemperature: number;
  createdAt: Date;
  updatedAt: Date;
};
