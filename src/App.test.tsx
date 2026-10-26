import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { saveData } from "./storage";
import { emptyData } from "./domain";

describe("recipe app", () => {
  it("shows exactly the requested Nutrients placeholder", async () => {
    render(<App />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Nutrients" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Work In Progress" }),
    ).toBeVisible();
    expect(
      screen.queryByText(/calories|protein|vitamins/i),
    ).not.toBeInTheDocument();
  });
  it("creates a recipe, adds a priced ingredient and plans it for shopping", async () => {
    await saveData(emptyData());
    render(<App />);
    await userEvent.click(
      await screen.findByRole("button", { name: "New recipe" }),
    );
    let dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Recipe name"), {
      target: { value: "My rice bowl" },
    });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Create recipe" }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Add ingredient" }),
    );
    dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Ingredient name"), {
      target: { value: "Rice" },
    });
    fireEvent.change(within(dialog).getByLabelText("Amount"), {
      target: { value: "300" },
    });
    await userEvent.click(within(dialog).getByText("Pack price (optional)"));
    fireEvent.change(within(dialog).getByLabelText("Pack size (g)"), {
      target: { value: "500" },
    });
    fireEvent.change(within(dialog).getByLabelText("Price per pack (kr)"), {
      target: { value: "35,50" },
    });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Add to recipe" }),
    );
    expect(
      await screen.findByRole("button", { name: /Edit Rice/ }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Plan this recipe" }),
    );
    dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Add to week" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Shopping" }));
    expect(await screen.findByText("Rice", { exact: true })).toBeVisible();
    expect(screen.getByText(/1 pack/)).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: "Bought Rice" }),
    ).not.toBeChecked();
  });
});
