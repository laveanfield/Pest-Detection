import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import UploadPanel from "../UploadPanel";

test("renders UploadPanel and Start Detection button", () => {
  render(
    <UploadPanel
      userId="demo"
      setUserId={() => {}}
      previewUrl=""
      handleFileChange={() => {}}
      handleSubmit={() => {}}
      confidence={0.5}
      setConfidence={() => {}}
      isWorking={false}
    />
  );

  expect(screen.getByText(/Start Detection/i)).toBeInTheDocument();
});
