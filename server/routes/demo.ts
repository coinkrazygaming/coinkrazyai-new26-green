import { RequestHandler } from "express";
import { ApiResponse } from "@shared/api";

export const handleDemo: RequestHandler = (req, res) => {
  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: {
      message: "Hello from Express server",
    },
  };
  res.status(200).json(response);
};
