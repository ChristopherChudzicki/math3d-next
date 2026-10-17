import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "@/ui/Button";
import { Toaster, createToastManager } from ".";

const MESSAGES = [
  "Couldn’t save your changes. Try again.",
  "Your sign-in couldn’t be verified, so nothing was deleted. Try again.",
];

const Toasts: React.FC = () => {
  const [toastManager] = useState(createToastManager);
  const show = (description: string) =>
    toastManager.add({ description, priority: "low", timeout: 0 });
  useEffect(() => {
    show(MESSAGES[0]);
    // Once, on mount, so the story opens with a toast showing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      {MESSAGES.map((message) => (
        <Button key={message} onClick={() => show(message)}>
          Show “{message.slice(0, 24)}…”
        </Button>
      ))}
      <Toaster toastManager={toastManager} />
    </>
  );
};

const meta: Meta<typeof Toasts> = {
  title: "ui/Toast",
  component: Toasts,
};
export default meta;

export const ShortAndLong: StoryObj<typeof Toasts> = {};
