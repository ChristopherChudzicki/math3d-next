import React, { useEffect, useRef } from "react";
import * as yup from "yup";
import { useNavigate } from "react-router";
import { isApiError, useUserMeDelete } from "@math3d/api";
import { useAuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import { useSignInDialog } from "@/features/overlays/useSignInDialog";
import type { OverlayProps } from "@/features/overlays/useOverlay";
import { Dialog } from "@/ui/Dialog";
import Alert from "@/ui/Alert";
import Button from "@/ui/Button";
import TextField from "@/ui/TextField";
import { TextButton } from "@/ui/TextLink";
import composeRefs from "@/util/composeRefs";
import { useValidatedForm } from "@/util/forms";
import { useNotifications } from "@/features/notifications/NotificationsContext";
import { dismissToast, showToast } from "@/features/toasts";
import styles from "./DeleteAccountPage.module.css";

const CONFIRM_PROMPT = "Yes, permanently delete";
const FORBIDDEN_TOAST =
  "Your sign-in couldn’t be verified, so nothing was deleted. Try again.";

const schema = yup.object({
  confirm: yup.string().required().oneOf([CONFIRM_PROMPT]),
});

const DeleteAccountPage: React.FC<OverlayProps> = ({ children }) => {
  const { open, close } = useOverlay();
  const { open: openSignIn } = useSignInDialog();
  const isAuthenticated = useAuthStatus();
  // Failures show in the form, or as the 403 toast below.
  const deleteAccount = useUserMeDelete({ meta: { errorToast: false } });
  const { add: addNotification } = useNotifications();
  const navigate = useNavigate();
  const confirmRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useValidatedForm({ schema });
  const { ref: registerRef, ...confirmField } = register("confirm");

  // A successful delete flips auth authenticated → unauthenticated, and that
  // deliberate case has its own flow (the "Account Deleted" notice, then
  // navigate away) which a login redirect would hijack. Anyone else who is
  // unauthenticated here — a hand-typed /?overlay=delete-account while logged
  // out, or a session that expired mid-dialog — is sent to sign in. Sign-in
  // replaces this dialog rather than stacking on it: Google offers the account
  // chooser, and a different account would return to a delete dialog.
  useEffect(() => {
    if (isAuthenticated === "unauthenticated" && !deleteAccount.isSuccess) {
      openSignIn({ replaceOverlay: true });
    }
  }, [isAuthenticated, openSignIn, deleteAccount.isSuccess]);

  const onSubmit = handleSubmit(async () => {
    try {
      await deleteAccount.mutateAsync();
    } catch (err) {
      // Anything else is a genuine failure: the form's generic message and its
      // Sentry event are the right answer.
      if (!isApiError(err, [403])) throw err;
      // mutateAsync awaits onError, which has already cleared the cached
      // identity; when the session is what failed, the effect above switches
      // this dialog to sign-in, under the toast. A CSRF token that did not
      // check out is answered 403 too, so the message names neither cause.
      showToast(FORBIDDEN_TOAST);
      return;
    }
    dismissToast(FORBIDDEN_TOAST);
    // mutateAsync awaits onSuccess, which resets queries, so auth status is
    // already up-to-date.
    addNotification({
      title: "Account Deleted",
      body: "Your account has been deleted.",
      type: "alert",
    });
    navigate("/");
  });

  // Without a session there is no account to delete, and firing the request
  // anyway would race the redirect above. Sign-in, if open, still renders.
  if (isAuthenticated !== "authenticated" && !deleteAccount.isSuccess) {
    return children;
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(isOpen) => {
        // The delete still completes after a close; stay for its outcome.
        if (!isOpen && !deleteAccount.isPending) close();
      }}
    >
      <Dialog.Popup size="md" initialFocus={confirmRef}>
        <Dialog.Header closeDisabled={deleteAccount.isPending}>
          <Dialog.Title>Delete Account</Dialog.Title>
        </Dialog.Header>
        <Dialog.Form onSubmit={onSubmit}>
          <Dialog.Body className={styles.fields}>
            <Alert severity="error" announce={false}>
              This action cannot be undone. Scenes you have saved stay published
              at their existing links, with no account able to edit or remove
              them — delete them from{" "}
              <TextButton onClick={() => open("scenes", { list: "me" })}>
                My Scenes
              </TextButton>{" "}
              first if you don&rsquo;t want that. Signing in with Google again
              later creates a new, empty account.
            </Alert>
            <TextField
              invalid={!!errors.confirm?.message}
              description={`To proceed, enter "${CONFIRM_PROMPT}" exactly.`}
              label="Confirm"
              ref={composeRefs(confirmRef, registerRef)}
              {...confirmField}
            />
            {errors.root?.message ? (
              <Alert severity="error">{errors.root.message}</Alert>
            ) : null}
          </Dialog.Body>
          <Dialog.Actions>
            <Dialog.Close
              render={<Button>Cancel</Button>}
              disabled={deleteAccount.isPending}
            />
            <Button
              type="submit"
              variant="solid"
              tone="danger"
              loading={deleteAccount.isPending || deleteAccount.isSuccess}
            >
              Delete Account
            </Button>
          </Dialog.Actions>
        </Dialog.Form>
        {children}
      </Dialog.Popup>
    </Dialog.Root>
  );
};

export default DeleteAccountPage;
