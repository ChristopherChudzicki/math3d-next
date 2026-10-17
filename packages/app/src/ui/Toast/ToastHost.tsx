import React from "react";
import { Toaster } from ".";
import { toastManager } from "./toasts";

const ToastHost: React.FC = () => <Toaster toastManager={toastManager} />;

export default ToastHost;
