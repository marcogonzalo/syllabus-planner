import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AddModuleDialog } from "./AddModuleDialog";

describe("AddModuleDialog", () => {
  it("submits title and duration_days", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <AddModuleDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Warmup" },
    });
    fireEvent.change(screen.getByLabelText("Duration (days)"), {
      target: { value: "0.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add module" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "Warmup",
        duration_days: 0.5,
      });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows validation when title missing", async () => {
    const onSubmit = vi.fn();

    render(
      <AddModuleDialog open onOpenChange={() => {}} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add module" }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
