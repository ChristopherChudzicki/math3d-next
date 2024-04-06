import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import invariant from "tiny-invariant";
import IdGenerator from "@/util/idGenerator";

const idGenerator = new IdGenerator({ prefix: "notification" });

type Notification = {
  id: string;
  type: "alert" | "confirmation";
  title: React.ReactNode;
  body: React.ReactNode;
  confirmed: Promise<boolean>;
};
type NotificationInternal = Notification & {
  resolve: (value: boolean) => void;
};

type NotificationsContextResult = {
  notifications: Notification[];
  add: (notification: Omit<Notification, "id" | "confirmed">) => Notification;
  remove: (id: string, confirmed: boolean) => void;
};

const NotificationsContext = createContext<NotificationsContextResult>({
  notifications: [],
  add: () => {
    throw new Error("NotificationsContext not provided");
  },
  remove: () => invariant(false, "NotificationsContext not provided"),
});

const NotificationsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationInternal[]>(
    [],
  );

  const add: NotificationsContextResult["add"] = useCallback(({ ...data }) => {
    let resolveNotification: (value: boolean) => void = () => {
      throw new Error("Resolve not assigned");
    };
    const notification: NotificationInternal = {
      ...data,
      id: idGenerator.next(),
      resolve: (value: boolean) => resolveNotification(value),
      confirmed: new Promise((resolve) => {
        resolveNotification = resolve;
      }),
    };
    setNotifications((prev) => [...prev, notification]);
    return notification;
  }, []);

  const remove: NotificationsContextResult["remove"] = useCallback(
    (id: string, confirmed: boolean) => {
      const target = notifications.find((n) => n.id === id);
      invariant(target, "Notification not found");
      target.resolve(confirmed);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [notifications],
  );

  const result = useMemo(
    () => ({ notifications, add, remove }),
    [notifications, add, remove],
  );

  return (
    <NotificationsContext.Provider value={result}>
      {children}
    </NotificationsContext.Provider>
  );
};

const useNotifications = (): NotificationsContextResult => {
  return useContext(NotificationsContext);
};

export { NotificationsProvider, useNotifications };
