import React, { useEffect, useRef, useState } from "react";
import * as yup from "yup";
import { Alert, TextField } from "@mui/material";
import { useNavigate } from "react-router";
import { isApiError, useUserMeDelete } from "@math3d/api";
import { useAuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import { useSignInDialog } from "@/features/overlays/useSignInDialog";
import { Dialog } from "@/ui/Dialog";
import Button from "@/ui/Button";
import { TextButton } from "@/ui/TextLink";
import { useValidatedForm } from "@/util/forms";
import { useNotifications } from "@/features/notifications/NotificationsContext";

const CONFIRM_PROMPT = "Yes, permanently delete";

const schema = yup.object({
  confirm: yup.string().required().oneOf([CONFIRM_PROMPT]),
});

const DeleteAccountPage: React.FC = () => {
  const { open, close } = useOverlay();
  const { open: openSignIn } = useSignInDialog();
  const isAuthenticated = useAuthStatus();
  const deleteAccount = useUserMeDelete();
  const { add: addNotification } = useNotifications();
  const navigate = useNavigate();
  // While the 403 notice shows, sign-in waits: a dialog opened over the notice
  // would hide it.
  const [noticeOpen, setNoticeOpen] = useState(false);
  const confirmRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useValidatedForm({ schema });

  // A successful delete flips auth authenticated → unauthenticated, and that
  // deliberate case has its own flow (the "Account Deleted" notice, then
  // navigate away) which a login redirect would hijack. Anyone else who is
  // unauthenticated here — a hand-typed /?overlay=delete-account while logged
  // out, or a session that expired mid-dialog — is sent to sign in. Sign-in
  // replaces this dialog rather than stacking on it: Google offers the account
  // chooser, and a different account would return to a delete dialog.
  useEffect(() => {
    if (
      isAuthenticated === "unauthenticated" &&
      !deleteAccount.isSuccess &&
      !noticeOpen
    ) {
      openSignIn({ replaceOverlay: true });
    }
  }, [isAuthenticated, openSignIn, deleteAccount.isSuccess, noticeOpen]);

  const onSubmit = handleSubmit(async () => {
    try {
      await deleteAccount.mutateAsync();
    } catch (err) {
      // Anything else is a genuine failure: the form's generic message and its
      // Sentry event are the right answer.
      if (!isApiError(err, [403])) throw err;
      // mutateAsync awaits onError, which has already cleared the cached
      // identity; when the session is what failed, the effect above switches
      // this dialog to sign-in once the notice closes. A CSRF token that did
      // not check out is answered 403 too, so the message names neither cause.
      setNoticeOpen(true);
      const { confirmed } = addNotification({
        title: "Could not delete your account",
        body: "Your sign-in could not be verified, so nothing was deleted. Try again — you may be asked to sign in first.",
        type: "alert",
      });
      confirmed.then(() => setNoticeOpen(false));
      return;
    }
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
  // anyway would race the redirect above.
  if (isAuthenticated !== "authenticated" && !deleteAccount.isSuccess) {
    return null;
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
          <Dialog.Body>
            <Alert severity="error">
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
              fullWidth
              margin="normal"
              error={!!errors.confirm?.message}
              helperText={`To proceed, enter "${CONFIRM_PROMPT}" exactly.`}
              label="Confirm"
              type="text"
              inputRef={confirmRef}
              {...register("confirm")}
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
      </Dialog.Popup>
    </Dialog.Root>
  );
};

export default DeleteAccountPage;
