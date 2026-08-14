import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InlineEditor } from "./InlineEditor";

describe("InlineEditor", () => {
  it("renders the value as text when not editing", () => {
    render(<InlineEditor value="Hello world" onSave={() => {}} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders placeholder when value is empty", () => {
    render(
      <InlineEditor value="" onSave={() => {}} placeholder="Click to edit" />,
    );
    expect(screen.getByText("Click to edit")).toBeInTheDocument();
  });

  it("shows input when clicked", () => {
    render(<InlineEditor value="Title" onSave={() => {}} />);
    fireEvent.click(screen.getByText("Title"));
    expect(screen.getByDisplayValue("Title")).toBeInTheDocument();
  });

  it("calls onSave with new value on blur", async () => {
    const onSave = vi.fn();
    render(<InlineEditor value="Old" onSave={onSave} />);
    fireEvent.click(screen.getByText("Old"));
    const input = screen.getByDisplayValue("Old");
    fireEvent.change(input, { target: { value: "New" } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith("New");
  });

  it("cancels on Escape", () => {
    const onSave = vi.fn();
    render(<InlineEditor value="Original" onSave={onSave} />);
    fireEvent.click(screen.getByText("Original"));
    const input = screen.getByDisplayValue("Original");
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("opens controlled multiline editor when editing is true", () => {
    render(
      <InlineEditor
        value={"Title\nBody line"}
        onSave={() => {}}
        multiline
        displayValue="Title"
        editing={true}
        onEditingChange={() => {}}
      />,
    );
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Title\nBody line");
  });
});
