import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function ThemeProbe() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <div data-testid="active-theme">{theme}</div>
      <button onClick={() => setTheme("light")} type="button">
        Switch to Light
      </button>
      <button onClick={() => setTheme("dark")} type="button">
        Switch to Dark
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = "";
  });

  it("defaults to dark and persists theme changes", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("active-theme")).toHaveTextContent("dark");
      expect(document.documentElement.dataset.theme).toBe("dark");
    });

    await user.click(screen.getByRole("button", { name: "Switch to Light" }));

    await waitFor(() => {
      expect(screen.getByTestId("active-theme")).toHaveTextContent("light");
      expect(document.documentElement.dataset.theme).toBe("light");
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    });
  });

  it("restores a saved theme from localStorage", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("active-theme")).toHaveTextContent("light");
      expect(document.documentElement.dataset.theme).toBe("light");
      expect(document.documentElement.style.colorScheme).toBe("light");
    });
  });
});
