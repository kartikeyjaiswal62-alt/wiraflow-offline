/**
 * Wiraflow Action Resolver
 *
 * Determines what action to perform when a widget is interacted with in Test Mode.
 * Supports explicit actions (from widget.action) and inferred actions (from labels/roles).
 */

import type { DesignSpec } from "./types";

export interface ResolvedAction {
  type: "navigate" | "submit_form" | "auth" | "toast" | "go_back" | "none";
  targetPageKey?: string;
  formFields?: Record<string, string>;
  toastMessage?: string;
  label?: string;
}

/**
 * Resolve what action a widget should trigger.
 */
export function resolveWidgetAction(
  widgetKey: string,
  spec: DesignSpec,
  formState: Record<string, string>
): ResolvedAction {
  // Find the widget across all pages
  let widget: any = null;
  let parentPage: any = null;
  for (const page of spec.pages) {
    const found = page.widgets.find((w) => w.key === widgetKey);
    if (found) {
      widget = found;
      parentPage = page;
      break;
    }
  }

  if (!widget) return { type: "none" };

  const label = getWidgetLabel(widget).toLowerCase();
  const iconName = (
    widget.properties?.name?.icon?.name ||
    widget.properties?.icon?.stringVal?.value ||
    widget.properties?.icon?.icon?.name ||
    ""
  ).toLowerCase();

  // 0. Detect back navigation
  if (
    iconName.includes("arrow_back") ||
    iconName.includes("chevron_left") ||
    label === "back" ||
    label.includes("go back")
  ) {
    return { type: "go_back", label: widget.label };
  }

  // 1. Explicit action property
  if (widget.action) {
    if (widget.action.operation === "navigate" && widget.action.targetPageKey) {
      return { type: "navigate", targetPageKey: widget.action.targetPageKey, label: widget.label };
    }
    if (widget.action.operation === "mutation") {
      return {
        type: "submit_form",
        formFields: formState,
        toastMessage: `${widget.label || "Action"} submitted successfully!`,
        label: widget.label,
      };
    }
  }

  // 2. Infer from semantic role
  if (widget.semanticRole === "submit_form" || widget.semanticRole === "action_trigger") {
    // Auth-related buttons
    if (label.includes("sign in") || label.includes("login") || label.includes("log in")) {
      return {
        type: "auth",
        formFields: formState,
        toastMessage: "Signed in successfully!",
        label: widget.label,
        targetPageKey: findPageByType(spec, "dashboard") || findPageByType(spec, "list"),
      };
    }
    if (label.includes("sign up") || label.includes("create account") || label.includes("register")) {
      return {
        type: "auth",
        formFields: formState,
        toastMessage: "Account created!",
        label: widget.label,
        targetPageKey: findPageByType(spec, "dashboard") || findPageByType(spec, "list"),
      };
    }
    if (label.includes("get started") || label.includes("continue") || label.includes("next")) {
      // Navigate to the next page in order
      const currentIdx = spec.pages.findIndex((p) => p.key === parentPage?.key);
      const nextPage = spec.pages[currentIdx + 1];
      if (nextPage) {
        return { type: "navigate", targetPageKey: nextPage.key, label: widget.label };
      }
    }
    if (label.includes("log out") || label.includes("sign out") || label.includes("logout")) {
      return {
        type: "navigate",
        targetPageKey: findPageByType(spec, "form") || spec.pages[0]?.key,
        toastMessage: "Logged out",
        label: widget.label,
      };
    }
    if (label.includes("save") || label.includes("submit") || label.includes("add to cart") || label.includes("confirm") || label.includes("record") || label.includes("start")) {
      return {
        type: "submit_form",
        formFields: formState,
        toastMessage: `${widget.label || "Action"} completed!`,
        label: widget.label,
      };
    }
  }

  // 3. Infer navigation from icon_end arrow
  const iconEnd = widget.properties?.icon_end?.icon?.name;
  if (iconEnd && (iconEnd.includes("arrow_forward") || iconEnd.includes("chevron_right"))) {
    const currentIdx = spec.pages.findIndex((p) => p.key === parentPage?.key);
    const nextPage = spec.pages[currentIdx + 1];
    if (nextPage) {
      return { type: "navigate", targetPageKey: nextPage.key, label: widget.label };
    }
  }

  // 4. IconButton with navigation-like icons
  if (widget.flutterWidgetType === "IconButton" || widget.flutterWidgetType === "FloatingActionButton") {
    if (iconName.includes("add") || iconName.includes("plus") || iconName.includes("create")) {
      return {
        type: "toast",
        toastMessage: `${widget.label || "New item"} action triggered`,
        label: widget.label,
      };
    }
    if (iconName.includes("settings") || iconName.includes("tune")) {
      const settingsPage = findPageByType(spec, "settings");
      if (settingsPage) return { type: "navigate", targetPageKey: settingsPage, label: widget.label };
    }
    if (iconName.includes("search")) {
      const searchPage = findPageByType(spec, "search") || findPageByType(spec, "explore");
      if (searchPage) return { type: "navigate", targetPageKey: searchPage, label: widget.label };
    }
    if (iconName.includes("home")) {
      const homePage = findPageByType(spec, "dashboard") || findPageByType(spec, "list") || spec.pages[0]?.key;
      if (homePage) return { type: "navigate", targetPageKey: homePage, label: widget.label };
    }
    if (iconName.includes("person") || iconName.includes("account")) {
      const profilePage = findPageByType(spec, "profile");
      if (profilePage) return { type: "navigate", targetPageKey: profilePage, label: widget.label };
    }
    if (iconName.includes("notifications") || iconName.includes("bell")) {
      const notifPage = findPageByType(spec, "notifications");
      if (notifPage) return { type: "navigate", targetPageKey: notifPage, label: widget.label };
    }
    // Generic tappable: show toast
    return {
      type: "toast",
      toastMessage: `${widget.label || iconName || "Button"} tapped`,
      label: widget.label,
    };
  }

  // 5. Any remaining Button/SocialButton that wasn't caught
  if (widget.flutterWidgetType === "Button" || widget.flutterWidgetType === "SocialButton") {
    if (label.includes("guest")) {
      return {
        type: "auth",
        formFields: {},
        toastMessage: "Continuing as guest",
        label: widget.label,
        targetPageKey: findPageByType(spec, "dashboard") || findPageByType(spec, "list"),
      };
    }
    return {
      type: "toast",
      toastMessage: `"${getWidgetLabel(widget) || "Button"}" tapped`,
      label: widget.label,
    };
  }

  return { type: "none" };
}

/**
 * Resolve BottomNavigationBar item tap to a page navigation.
 */
export function resolveBottomNavAction(
  items: Array<{ icon?: string; label?: string; pageKey?: string }>,
  itemIndex: number,
  spec: DesignSpec
): ResolvedAction {
  const item = items[itemIndex];
  if (!item) return { type: "none" };

  if (item.pageKey) {
    const pageExists = spec.pages.some((p) => p.key === item.pageKey);
    if (pageExists) {
      return { type: "navigate", targetPageKey: item.pageKey, label: item.label };
    }
  }

  // Try to match by label
  const label = (item.label || "").toLowerCase();
  for (const page of spec.pages) {
    const pageName = typeof page.name === "string"
      ? page.name
      : String((page.name as any)?.stringVal?.value || page.key || "");
    if (pageName.toLowerCase().includes(label) || page.key.includes(label)) {
      return { type: "navigate", targetPageKey: page.key, label: item.label };
    }
  }

  return { type: "none" };
}

function getWidgetLabel(widget: any): string {
  const content = widget.properties?.content?.stringVal?.value;
  if (content) return String(content);
  // label may be a plain string or a DSL boxed object
  const label = widget.label;
  if (typeof label === "string") return label;
  if (label && typeof label === "object" && label.stringVal?.value) return String(label.stringVal.value);
  return "";
}

function findPageByType(spec: DesignSpec, pageType: string): string | undefined {
  const page = spec.pages.find((p) => {
    const pt = typeof p.pageType === "string" ? p.pageType : String((p.pageType as any)?.stringVal?.value || "");
    return pt === pageType;
  });
  return page?.key;
}
