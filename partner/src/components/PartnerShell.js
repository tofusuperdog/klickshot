"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LanguageSwitcher, usePartnerLanguage } from "@/components/PartnerLanguageProvider";

const menuItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: "home" },
  { href: "/series", labelKey: "nav.series", icon: "series" },
  { href: "/billing", labelKey: "nav.billing", icon: "billing" },
  { href: "/feedback", labelKey: "nav.feedback", icon: "feedback" },
];

function NavIcon({ name }) {
  if (name === "home" || name === "series" || name === "billing" || name === "feedback") {
    return <span className={`nav-icon nav-icon-${name}`} aria-hidden="true" />;
  }

  return null;
}

function ProducerIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PasswordVisibilityIcon({ isVisible }) {
  if (isVisible) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3.8 4.3 2.5l17.2 17.2-1.3 1.3-3.1-3.1A10.9 10.9 0 0 1 12 19C7 19 2.7 16.1 1 12c.8-1.9 2.1-3.6 3.7-4.8L3 3.8Zm6.3 6.3a3 3 0 0 0 4.1 4.1l-4.1-4.1ZM12 5c5 0 9.3 2.9 11 7a11.8 11.8 0 0 1-3.1 4.2l-2.4-2.4A5.9 5.9 0 0 0 10.2 6.5L8.3 4.6A11 11 0 0 1 12 5Zm0 3c-.4 0-.8.1-1.1.2l4.9 4.9A3.8 3.8 0 0 0 16 12a4 4 0 0 0-4-4Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5c5 0 9.3 2.9 11 7-1.7 4.1-6 7-11 7S2.7 16.1 1 12c1.7-4.1 6-7 11-7Zm0 2C8 7 4.6 9 3.2 12 4.6 15 8 17 12 17s7.4-2 8.8-5C19.4 9 16 7 12 7Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
    </svg>
  );
}

function MenuIcon({ isOpen }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {isOpen ? (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export default function PartnerShell({ producer, children }) {
  const { t } = usePartnerLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visiblePasswordFields, setVisiblePasswordFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotification(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setVisiblePasswordFields({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
    setPasswordError("");
    setIsPasswordOpen(true);
  };

  const closePasswordModal = () => {
    if (isChangingPassword) {
      return;
    }

    setIsPasswordOpen(false);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
    setPasswordError("");
  };

  const togglePasswordVisibility = (field) => {
    setVisiblePasswordFields((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (isChangingPassword) {
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(t("password.missing"));
      return;
    }

    if (/\s/.test(passwordForm.newPassword)) {
      setPasswordError(t("password.noSpaces"));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t("password.tooShort"));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t("password.mismatch"));
      return;
    }

    setIsChangingPassword(true);
    setPasswordError("");

    try {
      const response = await fetch("/api/partner/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPasswordError(data.error || t("password.failed"));
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setVisiblePasswordFields({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
      setIsPasswordOpen(false);
      setNotification({
        title: t("password.successTitle"),
        message: t("password.successMessage"),
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch("/api/partner/logout", {
        method: "POST",
        credentials: "include",
      });
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="partner-app">
      <header className="mobile-topbar">
        <Link href="/dashboard" className="mobile-logo" onClick={() => setIsMobileMenuOpen(false)}>
          <Image
            src="/klickshotlogo.webp"
            alt="Klickshot"
            fill
            sizes="150px"
            priority
          />
        </Link>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label={isMobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-partner-menu"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          <MenuIcon isOpen={isMobileMenuOpen} />
        </button>
      </header>

      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <Image
            src="/klickshotlogo.webp"
            alt="Klickshot"
            fill
            sizes="180px"
            priority
          />
        </div>

        <button type="button" className="producer-card producer-card-button" onClick={openPasswordModal}>
          <div className="producer-avatar">
            <ProducerIcon />
          </div>
          <div className="producer-meta">
            <span>{t("shell.signedInAs")}</span>
            <strong>{producer.name}</strong>
            <small>@{producer.username}</small>
          </div>
        </button>

        <LanguageSwitcher />

        <nav className="app-nav" aria-label={t("nav.menu")}>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              className={pathname === item.href ? "active" : ""}
              href={item.href}
            >
              <NavIcon name={item.icon} />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <button type="button" className="logout-button" onClick={() => setIsLogoutOpen(true)}>
          <LogoutIcon />
          {t("shell.logout")}
        </button>
      </aside>

      <section className="app-content">{children}</section>

      {notification ? (
        <div className="partner-notification" role="status" aria-live="polite">
          <span className="partner-notification-icon">
            <SuccessIcon />
          </span>
          <span>
            <strong>{notification.title}</strong>
            <small>{notification.message}</small>
          </span>
        </div>
      ) : null}

      {isMobileMenuOpen ? (
        <div className="mobile-menu-backdrop" role="presentation" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            id="mobile-partner-menu"
            className="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menu")}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="mobile-profile-card"
              onClick={() => {
                setIsMobileMenuOpen(false);
                openPasswordModal();
              }}
            >
              <div className="producer-avatar">
                <ProducerIcon />
              </div>
              <div className="producer-meta">
                <span>{t("shell.signedInAs")}</span>
                <strong>{producer.name}</strong>
                <small>@{producer.username}</small>
              </div>
            </button>

            <LanguageSwitcher className="mobile-language-switcher" />

            <nav className="mobile-nav" aria-label={t("nav.mobileMenu")}>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  className={pathname === item.href ? "active" : ""}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <NavIcon name={item.icon} />
                  {t(item.labelKey)}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              className="mobile-logout-button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLogoutOpen(true);
              }}
            >
              <LogoutIcon />
              {t("shell.logout")}
            </button>
          </div>
        </div>
      ) : null}

      {isLogoutOpen ? (
        <div
          className="logout-confirm-backdrop"
          role="presentation"
        >
          <div
            className="logout-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="logout-confirm-icon">
              <LogoutIcon />
            </div>
            <div>
              <p className="logout-confirm-kicker">{t("shell.logoutConfirmKicker")}</p>
              <h2 id="logout-confirm-title">{t("shell.logoutConfirmTitle")}</h2>
              <p className="logout-confirm-copy">
                {t("shell.logoutConfirmCopy")}
              </p>
            </div>
            <div className="logout-confirm-actions">
              <button
                type="button"
                className="logout-confirm-secondary"
                onClick={() => setIsLogoutOpen(false)}
                disabled={isLoggingOut}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="logout-confirm-primary"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? t("shell.loggingOut") : t("shell.logout")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPasswordOpen ? (
        <div
          className="password-modal-backdrop"
          role="presentation"
        >
          <form
            className="password-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-modal-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleChangePassword}
          >
            <div className="password-modal-icon">
              <ProducerIcon />
            </div>
            <div>
              <p className="password-modal-kicker">{t("password.accountKicker")}</p>
              <h2 id="password-modal-title">{t("password.title")}</h2>
              <p className="password-modal-copy">
                {t("password.copy", { username: producer.username })}
              </p>
            </div>

            <div className="password-modal-fields">
              <label>
                <span>{t("password.current")}</span>
                <div className="password-modal-control">
                  <input
                    type={visiblePasswordFields.currentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => handlePasswordChange("currentPassword", event.target.value)}
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    className="password-modal-toggle"
                    onClick={() => togglePasswordVisibility("currentPassword")}
                    aria-label={visiblePasswordFields.currentPassword ? t("password.hideCurrent") : t("password.showCurrent")}
                    aria-pressed={visiblePasswordFields.currentPassword}
                    disabled={isChangingPassword}
                  >
                    <PasswordVisibilityIcon isVisible={visiblePasswordFields.currentPassword} />
                  </button>
                </div>
              </label>
              <label>
                <span>{t("password.new")}</span>
                <div className="password-modal-control">
                  <input
                    type={visiblePasswordFields.newPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={(event) => handlePasswordChange("newPassword", event.target.value)}
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    className="password-modal-toggle"
                    onClick={() => togglePasswordVisibility("newPassword")}
                    aria-label={visiblePasswordFields.newPassword ? t("password.hideNew") : t("password.showNew")}
                    aria-pressed={visiblePasswordFields.newPassword}
                    disabled={isChangingPassword}
                  >
                    <PasswordVisibilityIcon isVisible={visiblePasswordFields.newPassword} />
                  </button>
                </div>
              </label>
              <label>
                <span>{t("password.confirm")}</span>
                <div className="password-modal-control">
                  <input
                    type={visiblePasswordFields.confirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => handlePasswordChange("confirmPassword", event.target.value)}
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    className="password-modal-toggle"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    aria-label={visiblePasswordFields.confirmPassword ? t("password.hideConfirm") : t("password.showConfirm")}
                    aria-pressed={visiblePasswordFields.confirmPassword}
                    disabled={isChangingPassword}
                  >
                    <PasswordVisibilityIcon isVisible={visiblePasswordFields.confirmPassword} />
                  </button>
                </div>
              </label>
            </div>

            {passwordError ? <p className="password-modal-error">{passwordError}</p> : null}

            <div className="password-modal-actions">
              <button
                type="button"
                className="password-modal-secondary"
                onClick={closePasswordModal}
                disabled={isChangingPassword}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="password-modal-primary"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? t("password.saving") : t("password.save")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
