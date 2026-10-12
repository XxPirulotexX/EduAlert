import type { Student } from '../types';
import { STUDENTS } from '../data/mock';
import {
  readStoredData,
  writeStoredData,
} from './storage.service';

const STORAGE_KEY = 'students';

function getAll(): Student[] {
  return readStoredData<Student[]>(
    STORAGE_KEY,
    STUDENTS,
  );
}

export const studentsService = {
  getAll(): Student[] {
    return getAll();
  },

  getById(id: number): Student | undefined {
    return getAll().find((student) => student.id === id);
  },

  search(query: string): Student[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return getAll();
    }

    return getAll().filter((student) =>
      student.name.toLowerCase().includes(normalizedQuery),
    );
  },

  create(
    studentData: Omit<Student, 'id'>,
  ): Student {
    const students = getAll();

    const newId =
      students.length > 0
        ? Math.max(...students.map((student) => student.id)) + 1
        : 1;

    const newStudent: Student = {
      ...studentData,
      id: newId,
    };

    writeStoredData(STORAGE_KEY, [
      ...students,
      newStudent,
    ]);

    return newStudent;
  },

  update(
    id: number,
    changes: Partial<Omit<Student, 'id'>>,
  ): Student {
    const students = getAll();
    const existingStudent = students.find(
      (student) => student.id === id,
    );

    if (!existingStudent) {
      throw new Error(
        `No se encontró el estudiante con ID ${id}.`,
      );
    }

    const updatedStudent: Student = {
      ...existingStudent,
      ...changes,
      id,
    };

    const updatedStudents = students.map((student) =>
      student.id === id ? updatedStudent : student,
    );

    writeStoredData(STORAGE_KEY, updatedStudents);

    return updatedStudent;
  },

  delete(id: number): void {
    const students = getAll();
    const exists = students.some(
      (student) => student.id === id,
    );

    if (!exists) {
      throw new Error(
        `No se encontró el estudiante con ID ${id}.`,
      );
    }

    writeStoredData(
      STORAGE_KEY,
      students.filter((student) => student.id !== id),
    );
  },
};