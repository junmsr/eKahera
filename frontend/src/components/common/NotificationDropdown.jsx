import React, { useState, useMemo } from "react";
import { BiBell } from "react-icons/bi";
import { MdClose, MdCheck, MdCheckCircle } from "react-icons/md";
import { HiOutlineTrash } from "react-icons/hi";

/**
 * Modern NotificationDropdown Component with trending UI/UX
 * Features:
 * - Select All checkbox
 * - Mark as Read/Unread
 * - Delete individual or bulk notifications
 * - Visual indicators for read/unread status
 * - Smooth animations and hover states
 */
export default function NotificationDropdown({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onSelectAll,
  onDeselectAll,
  isOpen,
  onToggle,
  containerRef,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterMode, setFilterMode] = useState("all"); // all, unread, read

  // Filter notifications based on mode
  const filteredNotifications = useMemo(() => {
    if (filterMode === "unread") return notifications.filter((n) => !n.isRead);
    if (filterMode === "read") return notifications.filter((n) => n.isRead);
    return notifications;
  }, [notifications, filterMode]);

  // Handle individual notification selection
  const handleSelectNotification = (id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  // Handle mark as read for selected
  const handleMarkSelectedAsRead = () => {
    selectedIds.forEach((id) => {
      const notif = notifications.find((n) => n.id === id);
      if (notif && !notif.isRead) {
        onMarkAsRead(id);
      }
    });
    setSelectedIds(new Set());
  };

  // Handle mark as unread for selected
  const handleMarkSelectedAsUnread = () => {
    selectedIds.forEach((id) => {
      const notif = notifications.find((n) => n.id === id);
      if (notif && notif.isRead) {
        onMarkAsUnread(id);
      }
    });
    setSelectedIds(new Set());
  };

  // Handle delete selected
  const handleDeleteSelected = () => {
    if (window.confirm(`Delete ${selectedIds.size} notification(s)?`)) {
      selectedIds.forEach((id) => onDelete(id));
      setSelectedIds(new Set());
    }
  };

  // Handle delete single notification
  const handleDeleteSingle = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this notification?")) {
      onDelete(id);
    }
  };

  const isAllSelected =
    selectedIds.size === filteredNotifications.length &&
    filteredNotifications.length > 0;
  const hasBulkActions = selectedIds.size > 0;

  return (
    <div className="relative" ref={containerRef}>
      {/* Notification Bell Button */}
      <button
        onClick={onToggle}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors relative group"
        title="Notifications"
      >
        <BiBell className="w-5 h-5 text-gray-700 group-hover:text-gray-900" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BiBell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500">{unreadCount} unread</p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <MdClose className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          {notifications.length > 0 && (
            <div className="flex gap-1 px-4 pt-3 border-b border-gray-100 bg-gray-50">
              {["all", "unread", "read"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setFilterMode(mode);
                    setSelectedIds(new Set());
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    filterMode === mode
                      ? "bg-white text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Bulk Actions Bar */}
          {hasBulkActions && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                {selectedIds.size} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleMarkSelectedAsRead}
                  className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 text-xs"
                  title="Mark as read"
                >
                  <MdCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={handleMarkSelectedAsUnread}
                  className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 text-xs"
                  title="Mark as unread"
                >
                  <MdCheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600 hover:text-red-700 text-xs"
                  title="Delete selected"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[500px] overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              <>
                {/* Select All Checkbox */}
                {filteredNotifications.length > 1 && (
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 sticky top-0">
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 -m-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {isAllSelected ? "Deselect All" : "Select All"}
                      </span>
                    </label>
                  </div>
                )}

                {/* Notification Items */}
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b border-gray-100 transition-all duration-200 hover:bg-gray-50 group ${
                      !notification.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="px-4 py-3 flex gap-3">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(notification.id)}
                          onChange={() =>
                            handleSelectNotification(notification.id)
                          }
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <span className="inline-flex w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1.5">
                              {notification.time}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.isRead ? (
                              <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                                title="Mark as read"
                              >
                                <MdCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => onMarkAsUnread(notification.id)}
                                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                                title="Mark as unread"
                              >
                                <MdCheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) =>
                                handleDeleteSingle(notification.id, e)
                              }
                              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-gray-600 hover:text-red-600"
                              title="Delete"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-8 text-center">
                <BiBell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">
                  {filterMode === "unread"
                    ? "No unread notifications"
                    : filterMode === "read"
                    ? "No read notifications"
                    : "No notifications yet"}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex gap-2">
              <button
                onClick={() => {
                  const unreadIds = notifications
                    .filter((n) => !n.isRead)
                    .map((n) => n.id);
                  unreadIds.forEach((id) => onMarkAsRead(id));
                  setSelectedIds(new Set());
                }}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark All as Read
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Delete all notifications?")) {
                    notifications.forEach((n) => onDelete(n.id));
                    setSelectedIds(new Set());
                  }
                }}
                className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
