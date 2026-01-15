import { deleteAllUserNotifications, getUserNotifications } from "./database";

const POLL_INTERVAL = 2000;

let notificationPollInterval = null;
let lastNotificationCount = null;
let updateBadge = async () => {};

export function pollForUserNotifications() {
  // Evita più interval attivi
  if (notificationPollInterval) return;

  const notificationButton = document.getElementById('notification-button');
  if (!notificationButton) {
    console.warn("Pulsante notifiche non trovato");
    return;
  }

  notificationButton.removeEventListener('click', deleteNotifications);
  notificationButton.addEventListener('click', deleteNotifications);

  const badgeEl = document.getElementById("notifications-badge");
  if (!badgeEl) {
    console.warn("Badge notifiche non trovato");
    return;
  }

  updateBadge = async () => {
    try {
      const notifications = await getUserNotifications();
      const count = notifications?.length || 0;

      // Evita DOM update inutili
      if (count === lastNotificationCount) return;
      lastNotificationCount = count;

      if (count > 0) {
        badgeEl.textContent = count > 99 ? "99+" : count;
        badgeEl.classList.remove("hidden");
      } else {
        badgeEl.textContent = "0";
        badgeEl.classList.add("hidden");
      }
    } catch (err) {
      console.error("Errore polling notifiche:", err);
    }
  };

  // Prima chiamata immediata
  updateBadge();

  // Polling
  notificationPollInterval = setInterval(updateBadge, POLL_INTERVAL);
}

export function stopPollingUserNotifications() {
  if (notificationPollInterval) {
    clearInterval(notificationPollInterval);
    notificationPollInterval = null;
    lastNotificationCount = null;
  }
}

async function deleteNotifications(e) {
    await deleteAllUserNotifications();
    updateBadge();
}
