import React from "react";
import Toaster, { NoticeToaster } from "./Toaster";
import { noticeManager, toastManager } from "./toasts";

const ToastHost: React.FC = () => (
  <>
    <Toaster toastManager={toastManager} />
    <NoticeToaster toastManager={noticeManager} />
  </>
);

export default ToastHost;
