import Notification from "../models/Notification.js";

export const createNotification = async ({
  io,
  recipient,
  type,
  title,
  message,
  link = "",
  metadata = {},
}) => {
  // Notification.create() already returns the created document.
  // There is no need to query the same notification again.
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    link,
    metadata,
  });

  const notificationData = notification.toObject();

  if (io) {
    io.to(`user:${recipient.toString()}`).emit(
      "notification",
      notificationData
    );
  }

  return notificationData;
};
