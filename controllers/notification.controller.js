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

    if (isNaN(notificationId) && req.params.id) {
      // Original: if (isNaN(notificationId)). If no param id provided (clear all), notificationId is NaN?
      // Original: `const notificationId = parseInt(req.params.id);`
      // If `req.params.id` is undefined (can it be if route is /read/:id? Yes if not matched? No.
      // But maybe route is /read (all) vs /read/:id?
      // Original logic: `if (!notificationId) { ... }` (mark all).
      // `if (isNaN(notificationId))` (error).
      // If route is /read/, id is undefined? `parseInt(undefined)` -> NaN.
      // So `isNaN` check would trigger?
      // Original code: `if (isNaN(notificationId)) return Error`.
      // THEN `if (!notificationId)`.
      // This implies logic is unreachable if `isNaN` is checked first?
      // Unless `notificationId` corresponds to 0? `parseInt("0")` -> 0. `!0` -> true.
      // So it handles id=0 as "mark all"?
      // Or route is different.
      // If route is /read, `req.params.id` is undefined. `parseInt` -> NaN. `isNaN` -> true. Returns error?
      // So "Mark All" might have been broken or I misunderstand routing.
      // Assuming user passes valid ID or we have separate route for mark all?
      // "markAsRead" usually takes ID.
      // "clearAll" logic below handles DELETE.
      // Mark all as Read...
      // Let's assume standard behavior: ID provided -> mark one. No ID -> mark all?
      // But `parseInt` produces NaN for undefined.
      // If I assume correctness of service, I can pass `notificationId` (which might be NaN).
      // Service expects valid ID or undefined/null for all?
      // Service `if (!notificationId)`. `NaN` is falsy? No. `!NaN` is true.
      // So if NaN passed, service treats as mark all.
      // But controller `if (isNaN)` returns 400.
      // So original controller FORBADE mark all?
      // Wait, `if (!notificationId)` block exists.
      // How can `!notificationId` be true AND `isNaN(notificationId)` be false?
      // Only if `notificationId` is 0.
      // So "Mark All" only worked if you passed ID 0?
      // Or `req.params.id` was optional string?
      // I will replicate strict logic if possible, or improve it.
      // If user wants to mark all, they should probably hit a different endpoint or pass a flag.
      // But given old code structure, I'll assume standard REST: /notifications/:id/read -> id is param.
      // /notifications/read -> id missing.
    }

    if (isNaN(notificationId)) {
      // If it was intended to allow empty ID for mark all, then `isNaN` check prevented it unless logic was differnet.
      // Let's assume providing an ID is mandatory for this specific route handler unless it's 0.
      return new ApiError(res, {
        message: "invalid notifcation id",
        statuscode: 400,
      });
    }

    // Checking if ID is 0?
    // If ID is valid number, call service.

    // Wait, let's look at `if (!notificationId)` block in original.
    // It calls `UPDATE ... WHERE ... user_id=$1`. No ID constraint.
    // This updates ALL.
    // So if `notificationId` is 0, it updates all.
    // If `notificationId` is NaN, it returns 400.

    // So to mark all, client sends /read/0 ??

    const updated = await NotificationService.markAsRead(
      userId,
      notificationId,
    ); // If 0, service `if (!0)` -> true. Updates all.

    if (!updated) {
      // Service returns null if update failed (rowCount 0)
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
