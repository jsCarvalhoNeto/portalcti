export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface ThematicAxis {
  id: string;
  title: string;
  description: string;
  teachers: string[];
  technicalAreas: string[];
}

export interface TeamRegistration {
  axisId: string;
  leader: Student;
  members: string[];
}
