import React, { FC, ReactNode, useEffect, useState } from "react";
import {
  NavigationItem,
  getVisibleNavigationLinks,
} from "../../../static_content/navigation_data";
import { NavLink, useLocation } from "react-router-dom";
import { useHistory } from "react-router";
import logo from "../../../assets/img/fomo-main-logo.png";
import avatar from "../../../assets/img/avatar.png";
import { useStyles } from "./styles";
import ArrowDownIcon from "../../common/Icons/arrow_down_icon";
import { getNavIcon } from "../../common/Icons/nav_icons";
import { WalletButton } from "../../wallet/WalletButton";
import logout from "../../services/auth/logout";
import loader from "../../services/loader";

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  const classes = useStyles();
  const [userRole, setUserRole] = useState<string>("");
  const [userData, setUserData] = useState<any>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("fomoSidebarCollapsed") === "1"; } catch { return false; }
  });

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem("fomoSidebarCollapsed", next ? "1" : "0"); } catch {}
      return next;
    });

  const navigation = useHistory();
  const { pathname } = useLocation();
  const visibleNavigationLinks = getVisibleNavigationLinks(userRole);

  const isPathMatch = (target: string, exact?: boolean) => {
    if (!target) return false;
    return exact ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);
  };

  // Length of the most specific (longest) nav link that matches the current path.
  // Ensures only ONE header item is highlighted (e.g. /users_list/otc -> Bazaar, not Пользователи).
  const bestMatchLen = (() => {
    let best = 0;
    visibleNavigationLinks.forEach((item) => {
      if (item.isDropdown) {
        item.links.forEach((l) => { if (isPathMatch(l.link, l.exact) && l.link.length > best) best = l.link.length; });
      } else if (isPathMatch(item.link) && item.link.length > best) {
        best = item.link.length;
      }
    });
    return best;
  })();

  const isPathActive = (target: string, exact?: boolean) => {
    if (!isPathMatch(target, exact)) return false;
    return target.length === bestMatchLen;
  };

  const isItemActive = (item: NavigationItem) => {
    if (!item.isDropdown) return isPathActive(item.link);
    return item.links.some((link) => isPathActive(link.link, link.exact));
  };

  useEffect(() => {
    const role: string | null = localStorage.getItem("fomoRole");
    const user: any = localStorage.getItem("fomoUser");
    role && setUserRole(role);
    user && setUserData(JSON.parse(user));
  }, []);

  // Auto-expand the group that owns the active route.
  useEffect(() => {
    const active: Record<string, boolean> = {};
    visibleNavigationLinks.forEach((item) => {
      if (item.isDropdown && isItemActive(item)) active[item.title] = true;
    });
    setOpenGroups((current) => ({ ...active, ...current }));
    setMobileOpen(false);
  }, [pathname, userRole]);

  const toggleGroup = (title: string) =>
    setOpenGroups((current) => ({ ...current, [title]: !current[title] }));

  const confirmLogout = () => {
    logout();
    navigation.push("/login");
  };

  const avatarSrc = userData?.photo
    ? loader(userData.photo)
    : userData?.twitterData?.photo || avatar;

  return (
    <div className={classes.shell}>
      <div className={classes.mobileBar}>
        <button
          type="button"
          className={classes.burger}
          aria-label="Открыть меню"
          data-testid="sidebar-toggle"
          onClick={() => setMobileOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <img src={logo} alt="FOMO" />
      </div>

      {mobileOpen ? (
        <div className={classes.overlay} onClick={() => setMobileOpen(false)} />
      ) : null}

      <aside
        className={`${classes.sidebar} ${mobileOpen ? classes.sidebarOpen : ""} ${collapsed ? classes.sidebarCollapsed : ""}`}
        data-testid="app-sidebar"
      >
        <div className={classes.logoBox}>
          {!collapsed ? <img src={logo} alt="FOMO" /> : null}
          {!collapsed && userRole ? <span className={classes.roleTag}>{userRole}</span> : null}
          <button
            type="button"
            className={classes.collapseBtn}
            data-testid="sidebar-collapse-toggle"
            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
            onClick={toggleCollapsed}
          >
            <span style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(90deg)", display: "inline-flex" }}>
              <ArrowDownIcon />
            </span>
          </button>
        </div>

        <nav className={classes.nav}>
          {visibleNavigationLinks.map((item) => {
            const active = isItemActive(item);
            const NavIcon = getNavIcon(item.title);
            if (!item.isDropdown) {
              return (
                <NavLink
                  key={item.title}
                  to={item.link}
                  className={`${classes.navLink} ${active ? classes.navLinkActive : ""}`}
                  data-testid={`nav-${item.title}`}
                  title={collapsed ? item.title : undefined}
                  style={collapsed ? { justifyContent: "center" } : undefined}
                >
                  {collapsed ? (
                    <span className={`${classes.navIcon} ${active ? classes.navIconActive : ""}`}>
                      <NavIcon />
                    </span>
                  ) : (
                    <span>{item.title}</span>
                  )}
                </NavLink>
              );
            }
            const expanded = openGroups[item.title] ?? false;
            return (
              <div key={item.title}>
                <button
                  type="button"
                  className={`${classes.navLink} ${active ? classes.navLinkActive : ""}`}
                  data-testid={`nav-group-${item.title}`}
                  title={collapsed ? item.title : undefined}
                  style={collapsed ? { justifyContent: "center" } : undefined}
                  onClick={() => {
                    if (collapsed) { toggleCollapsed(); setOpenGroups((c) => ({ ...c, [item.title]: true })); return; }
                    toggleGroup(item.title);
                  }}
                >
                  {collapsed ? (
                    <span className={`${classes.navIcon} ${active ? classes.navIconActive : ""}`}>
                      <NavIcon />
                    </span>
                  ) : (
                    <>
                      <span>{item.title}</span>
                      <span className={`${classes.chevron} ${expanded ? classes.chevronOpen : ""}`}>
                        <ArrowDownIcon />
                      </span>
                    </>
                  )}
                </button>
                {expanded && !collapsed ? (
                  <div className={classes.subMenu}>
                    {item.links.map((link) => (
                      <NavLink
                        key={link.link}
                        to={link.link}
                        exact={link.exact}
                        className={classes.subLink}
                        activeClassName={classes.subLinkActive}
                        data-testid={`nav-link-${link.title}`}
                      >
                        {link.title}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className={classes.footer}>
          <WalletButton collapsed={collapsed} />
          {userMenuOpen ? (
            <div className={classes.logoutMenu}>
              <button
                className={classes.logoutButton}
                data-testid="logout-btn"
                onClick={confirmLogout}
              >
                Выйти
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className={classes.userButton}
            data-testid="user-menu-btn"
            onClick={() => setUserMenuOpen((v) => !v)}
          >
            <img src={avatarSrc} alt="user" />
            {!collapsed ? (
              <>
                <span className={classes.userMeta}>
                  <span className={classes.userName}>
                    {userData?.email || userData?.name || "Администратор"}
                  </span>
                  <span className={classes.userRole}>{userRole || "admin"}</span>
                </span>
                <span className={classes.chevron}>
                  <ArrowDownIcon />
                </span>
              </>
            ) : null}
          </button>
        </div>
      </aside>

      <div className={`${classes.content} ${collapsed ? classes.contentCollapsed : ""}`}>{children}</div>
    </div>
  );
};

export default Layout;
