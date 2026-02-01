import { showToast } from "../card/shared/feedback";

describe("feedback", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("showToast", () => {
    it("creates a toast element in the document body", () => {
      showToast("Test message", "success");
      const toast = document.body.querySelector("div");
      expect(toast).not.toBeNull();
      expect(toast?.textContent).toBe("Test message");
    });

    it("applies success variant styling", () => {
      showToast("Success!", "success");
      const toast = document.body.querySelector("div");
      expect(toast?.style.background).toContain("34, 197, 94");
    });

    it("applies info variant styling", () => {
      showToast("Info!", "info");
      const toast = document.body.querySelector("div");
      expect(toast?.style.background).toContain("59, 130, 246");
    });

    it("applies error variant styling", () => {
      showToast("Error!", "error");
      const toast = document.body.querySelector("div");
      expect(toast?.style.background).toContain("239, 68, 68");
    });

    it("positions toast at bottom center", () => {
      showToast("Test", "info");
      const toast = document.body.querySelector("div");
      expect(toast?.style.position).toBe("fixed");
      expect(toast?.style.bottom).toBe("20px");
      expect(toast?.style.left).toBe("50%");
    });

    it("removes toast after 2 seconds", () => {
      showToast("Test", "info");
      expect(document.body.querySelector("div")).not.toBeNull();

      jest.advanceTimersByTime(2000);

      expect(document.body.querySelector("div")).toBeNull();
    });

    it("can show multiple toasts", () => {
      showToast("First", "success");
      showToast("Second", "error");
      const toasts = document.body.querySelectorAll("div");
      expect(toasts.length).toBe(2);
    });
  });
});
