import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as NotificationService from "../services/notifications.service.js";

export const getNotification = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user.id;

    const result = await NotificationService.getNotifications(
      userId,
      page,
      limit,
    );

    return sendResponse(res, { ...result });
  } catch (err) {
    console.log(err);
    new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(notificationId)) {
      return new ApiError(res, {
        message: "invalid notifcation id",
        statuscode: 400,
      });
    }

    const updated = await NotificationService.markAsRead(
      userId,
      notificationId,
    );

    if (!updated) {
      return new ApiError(res, {
        message: "failed to update notifications, check notification id",
        statuscode: 400,
      });
    }

    return sendResponse(res, {
      message: notificationId
        ? "notificaitons marked as read successfully"
        : "notificaitons updated successfully", // specific message
      data: updated,
    });
  } catch (err) {
    console.log(err);
    if (
      err.message === "failed to update notifications, check notification id"
    ) {
      return new ApiError(res, { message: err.message, statuscode: 400 });
    }
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const clearAll = async (req, res) => {
  try {
    const userId = req.user.id;
    await NotificationService.clearAllNotifications(userId);
    return sendResponse(res, { message: "notifications cleared successfully" });
  } catch (err) {
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
