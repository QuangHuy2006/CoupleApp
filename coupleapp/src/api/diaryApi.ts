import axiosClient from "./axiosClient";

export interface DiaryData {
  title: string;
  content: string;
  images?: string[];
  location?: string;
}

export const diaryApi = {
  getAll: () => axiosClient.get("/api/diary/list"),
  create: (data: DiaryData) => axiosClient.post("/api/diary/create", data),
  getDetail: (id: string) => axiosClient.get(`/api/diary/${id}`),
  delete: (id: string) => axiosClient.delete(`/api/diary/${id}`),
};
