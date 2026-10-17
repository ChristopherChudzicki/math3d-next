import React from "react";
import { Toaster } from "@/ui/Toast";
import { toastManager } from "./toasts";

const ToastHost: React.FC = () => <Toaster toastManager={toastManager} />;

export default ToastHost;
