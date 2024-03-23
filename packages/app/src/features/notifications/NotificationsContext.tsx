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
  title: React.ReactNode;
  body: React.ReactNode;
};

type NotificationsContextResult = {
  notifications: Notification[];
  add: (notification: Omit<Notification, "id">) => void;
  remove: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextResult>({
  notifications: [],
  add: () => invariant(false, "NotificationsContext not provided"),
  remove: () => invariant(false, "NotificationsContext not provided"),
});

const NotificationsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const add: NotificationsContextResult["add"] = useCallback((notification) => {
    setNotifications((prev) => [
      ...prev,
      { ...notification, id: idGenerator.next() },
    ]);
  }, []);

  const remove: NotificationsContextResult["remove"] = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

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
