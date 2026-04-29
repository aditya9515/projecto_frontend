import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PricingPageClient } from "@/components/pricing/pricing-page-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("billing=monthly"),
}));

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    ready: true,
  }),
}));

describe("PricingPageClient", () => {
  it("renders both plans and updates the Pro price when toggled", async () => {
    const user = userEvent.setup();
    render(<PricingPageClient />);

    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("$8")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yearly" }));

    expect(screen.getByText("$80")).toBeInTheDocument();
    expect(screen.getByText("2 months free")).toBeInTheDocument();
  });
});
