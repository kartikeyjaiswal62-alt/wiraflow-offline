
export const globalTheme = {
  "fonts": {
    "primary": "google:Inter",
    "secondary": "google:JetBrains Mono"
  },
  "colors": {
    "light": {
      "primary": "#1A1A1A",
      "on_primary": "#FFFFFF",
      "secondary": "#4ADE80",
      "on_secondary": "#000000",
      "accent": "#22D7EE",
      "background": "#F8F9FA",
      "surface": "#FFFFFF",
      "on_surface": "#1A1A1A",
      "primary_text": "#1A1A1A",
      "secondary_text": "#666666",
      "hint": "#A1A1A1",
      "error": "#F472B6",
      "on_error": "#FFFFFF",
      "success": "#4ADE80",
      "divider": "#E5E5E5",
      "transparent": "#00000000"
    },
    "dark": {
      "primary": "#FFFFFF",
      "on_primary": "#000000",
      "secondary": "#22D3EE",
      "on_secondary": "#000000",
      "accent": "#FB923C",
      "background": "#000000",
      "surface": "#121212",
      "on_surface": "#F5F5F7",
      "primary_text": "#F5F5F7",
      "secondary_text": "#A1A1A6",
      "hint": "#333333",
      "error": "#F472B6",
      "on_error": "#000000",
      "success": "#4ADE80",
      "divider": "#333333",
      "transparent": "#00000000"
    }
  },
  "text_styles": {
    "headline_large": {
      "font": "primary",
      "size": 32,
      "weight": 700,
      "height": 1.2
    },
    "headline_medium": {
      "font": "primary",
      "size": 26,
      "weight": 600,
      "height": 1.25
    },
    "title_large": {
      "font": "primary",
      "size": 20,
      "weight": 600,
      "height": 1.3
    },
    "title_medium": {
      "font": "secondary",
      "size": 16,
      "weight": 600,
      "height": 1.4
    },
    "body_large": {
      "font": "secondary",
      "size": 16,
      "weight": 400,
      "height": 1.5
    },
    "body_medium": {
      "font": "secondary",
      "size": 14,
      "weight": 400,
      "height": 1.5
    },
    "body_small": {
      "font": "secondary",
      "size": 12,
      "weight": 400,
      "height": 1.4
    },
    "label_large": {
      "font": "primary",
      "size": 14,
      "weight": 600,
      "height": 1.3
    },
    "label_medium": {
      "font": "primary",
      "size": 12,
      "weight": 600,
      "height": 1.3
    },
    "label_small": {
      "font": "primary",
      "size": 10,
      "weight": 700,
      "height": 1.2
    }
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32
  },
  "radii": {
    "sm": 2,
    "md": 4,
    "lg": 8,
    "full": 9999
  },
  "shadows": {
    "sm": {
      "color": "#0000001A",
      "dx": 0,
      "dy": 1,
      "blur": 0,
      "spread": 0
    },
    "md": {
      "color": "#00000033",
      "dx": 0,
      "dy": 2,
      "blur": 0,
      "spread": 0
    },
    "lg": {
      "color": "#0000004D",
      "dx": 0,
      "dy": 4,
      "blur": 0,
      "spread": 0
    },
    "xl": {
      "color": "#00000066",
      "dx": 0,
      "dy": 8,
      "blur": 0,
      "spread": 0
    }
  },
  "gradients": {}
};

export const mockUIGraph = {
  version: "2.5.0",
  projectId: "proj-universal",
  pages: [
    { key: "page-dashboard", label: "Dashboard", pageType: "list", widgetKeys: [] },
    { key: "page-live-transcription", label: "Live Transcription", pageType: "detail", widgetKeys: ["w-scaffold-transcription", "w-safe-area-transcription", "w-main-col-transcription", "w-header-container", "w-header-row", "w-status-col", "w-status-row", "w-recording-dot", "w-recording-text", "w-health-metrics-container", "w-health-row", "w-health-box-timer", "w-timer-text", "w-bubbles-expanded", "w-bubble-component-1", "w-action-items-container", "w-action-items-text", "w-footer-container", "w-footer-row", "w-timer-widget", "w-recording-btn-stack", "w-blur-overlay", "w-blur-bg-box", "w-record-stop-btn"] },
    { key: "page-meeting-analysis", label: "Meeting Analysis", pageType: "detail", widgetKeys: [] },
    { key: "page-login", label: "Login", pageType: "form", widgetKeys: ["7ef44507-9c27-45c4-8817-aec0217c9a46","f7ab8d21-80ea-4fcf-9c7c-fe53be4ebf46","c0a3d9de-39b8-4736-a71c-2070c6cafe4e","ec9361ab-910d-42ab-9102-c008f6f9e357","00a95bce-dd13-4a98-85bc-8a1698ef659a","ff04798a-b661-459c-a013-d02d94523064","586e9663-caa1-463a-935c-c0b4fb4615bc","adc6079e-512f-4523-9bfc-83989605fff5","84106b9f-4ba8-4c8a-a2c9-544f2a138e65","d40d3e75-81f2-4077-b0df-da5c583d5a79","07f78ecc-dcee-488e-882a-0d094cf38e71","117e69f4-72c8-492f-887f-133af5ada128","e4ae4eb2-5615-4d94-a0b7-f0be673acaa8","f0e980e6-3dd3-4fef-a3d3-94dd12f76b0b","a6afb88e-94a7-4bd4-8d8c-ea2cbadf8f74","75f4d2c1-5a09-4424-880b-242b0d69d536","464d13cd-3527-46bd-ab80-79f97cbd117e","221a8401-ce01-460b-be5d-4c776b23f0f6","33cf7636-76ce-49be-aca0-5c46c3a87aad","0741ec14-84b1-4f56-85c5-c90a8c25fe93","ee2dff0d-5445-4cdb-aa9d-48b5bcdaa7d5","f6cd6d2a-9ce7-4914-bf08-7833bac5620c","fe4612a1-8b13-42eb-b120-2e0a8bdf41fb","feb871a4-82f4-43b1-8a91-0a26411240de","797fab12-94d7-46a8-985a-6edbe3236194","e1692792-f8c4-4ce7-9eff-2e372cfadf55","68ed3af5-2320-4dd7-94eb-e7e76c00629e","791428d8-475f-49e8-819d-31e557c4e1be","b5725407-b692-4ecc-93f7-3310dcf90f90","a24698f8-25c4-4baa-bb8b-d9b517a2bce0","97521a38-9c18-4418-94fc-20f8d01c4028","220cf53f-97a5-4afb-9ff0-78d4e7b39e3a","d6a5b680-c609-4742-82d7-709875f7492a","a603d44c-d4da-47a4-a77d-2e9e9f0cc722","c87e37e0-cedb-49ce-a5ef-3f02f085573b","6f65cf3f-4b93-43b5-898a-4d6d9ccf6d91","03b6eb5e-a113-461d-9f1e-bb4163fa920c","709e8d3b-344c-43e2-8fe4-d39c2530ff80","7e91abec-be17-40c5-8cf5-3ad09bd39069","41333642-2c96-4b0d-8ccd-53561a7d642b","a242c2c2-4c65-453c-a4f5-d51bdb6e19b1","12a44983-2e3f-47b9-8683-d02a61bd2ab9","005b57d7-3649-4164-8d59-ede944e335e6","3fe2370b-1cc4-49b0-a8cf-977087a5d7c8","fd0443c5-fe7a-4100-87ea-f0cffafcd715","0fb1bd37-707b-4376-a07b-0c8c97ea1acf","42265a11-a19f-486e-9e04-f6dbd58036e9","6ee993e9-91db-4fbe-bdde-4fc4d3e29f83","a4d58571-2fb1-4fec-9925-6df4caf975a6","bb0c2cf7-99e9-4221-b3cd-61a2c45495f9","2035ffe3-8078-42d8-b9dd-067941fb911b"] }
  ],
  widgets: [
  {
    "key": "7ef44507-9c27-45c4-8817-aec0217c9a46",
    "label": "scaffold",
    "flutterWidgetType": "Scaffold",
    "semanticRole": "layout_root",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "bg": {
        "color": {
          "color": "background"
        }
      },
      "safe_area": {
        "boolVal": {
          "value": true
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "f7ab8d21-80ea-4fcf-9c7c-fe53be4ebf46",
    "parentKey": "7ef44507-9c27-45c4-8817-aec0217c9a46",
    "label": "column",
    "flutterWidgetType": "Column",
    "semanticRole": "layout_column",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "scroll": {
        "boolVal": {
          "value": true
        }
      },
      "padding": {
        "edgeInsets": {
          "top": 0,
          "right": 0,
          "bottom": 0,
          "left": 0,
          "token": "lg"
        }
      },
      "spacing": {
        "stringVal": {
          "value": "xl"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "c0a3d9de-39b8-4736-a71c-2070c6cafe4e",
    "parentKey": "f7ab8d21-80ea-4fcf-9c7c-fe53be4ebf46",
    "label": "column",
    "flutterWidgetType": "Column",
    "semanticRole": "layout_column",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "cross_align": {
        "align": {
          "named": "start"
        }
      },
      "spacing": {
        "stringVal": {
          "value": "md"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "ec9361ab-910d-42ab-9102-c008f6f9e357",
    "parentKey": "c0a3d9de-39b8-4736-a71c-2070c6cafe4e",
    "label": "container",
    "flutterWidgetType": "Container",
    "semanticRole": "layout_container",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "width": {
        "px": {
          "value": 64,
          "isInfinity": false
        }
      },
      "height": {
        "px": {
          "value": 64,
          "isInfinity": false
        }
      },
      "bg": {
        "color": {
          "color": "primary"
        }
      },
      "radius": {
        "radius": {
          "topLeft": 24,
          "topRight": 24,
          "bottomLeft": 24,
          "bottomRight": 24
        }
      },
      "align_child": {
        "align": {
          "named": "center"
        }
      },
      "shadow": {
        "stringVal": {
          "value": "md"
        }
      },
      "clip": {
        "boolVal": {
          "value": true
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "00a95bce-dd13-4a98-85bc-8a1698ef659a",
    "parentKey": "ec9361ab-910d-42ab-9102-c008f6f9e357",
    "label": "stack",
    "flutterWidgetType": "Stack",
    "semanticRole": "layout_stack",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "fit": {
        "stringVal": {
          "value": "expand"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "ff04798a-b661-459c-a013-d02d94523064",
    "parentKey": "00a95bce-dd13-4a98-85bc-8a1698ef659a",
    "label": "container",
    "flutterWidgetType": "Container",
    "semanticRole": "layout_container",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "width": {
        "px": {
          "value": "Infinity",
          "isInfinity": true
        }
      },
      "height": {
        "px": {
          "value": "Infinity",
          "isInfinity": true
        }
      },
      "gradient": {
        "gradient": {
          "type": "GRADIENT_TYPE_RADIAL",
          "direction": "center",
          "stops": [
            {
              "color": "primary"
            },
            {
              "color": "#333333"
            }
          ]
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "586e9663-caa1-463a-935c-c0b4fb4615bc",
    "parentKey": "00a95bce-dd13-4a98-85bc-8a1698ef659a",
    "label": "center",
    "flutterWidgetType": "Center",
    "semanticRole": "layout_center",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {},
    "dataBindings": []
  },
  {
    "key": "adc6079e-512f-4523-9bfc-83989605fff5",
    "parentKey": "586e9663-caa1-463a-935c-c0b4fb4615bc",
    "label": "mic_rounded",
    "flutterWidgetType": "Icon",
    "semanticRole": "icon",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "name": {
        "icon": {
          "name": "mic_rounded"
        }
      },
      "color": {
        "color": {
          "color": "on_primary"
        }
      },
      "size": {
        "numberVal": {
          "value": 32
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "84106b9f-4ba8-4c8a-a2c9-544f2a138e65",
    "parentKey": "c0a3d9de-39b8-4736-a71c-2070c6cafe4e",
    "label": "column",
    "flutterWidgetType": "Column",
    "semanticRole": "layout_column",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "cross_align": {
        "align": {
          "named": "start"
        }
      },
      "spacing": {
        "stringVal": {
          "value": "xs"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "d40d3e75-81f2-4077-b0df-da5c583d5a79",
    "parentKey": "84106b9f-4ba8-4c8a-a2c9-544f2a138e65",
    "label": "Meeting Intelligence",
    "flutterWidgetType": "Text",
    "semanticRole": "text_body",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "content": {
        "stringVal": {
          "value": "Meeting Intelligence"
        }
      },
      "style": {
        "textStyle": {
          "styleName": "headline_medium"
        }
      },
      "color": {
        "color": {
          "color": "primary_text"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "07f78ecc-dcee-488e-882a-0d094cf38e71",
    "parentKey": "84106b9f-4ba8-4c8a-a2c9-544f2a138e65",
    "label": "Analyze transcripts, track health, and assign tasks with AI.",
    "flutterWidgetType": "Text",
    "semanticRole": "text_body",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "content": {
        "stringVal": {
          "value": "Analyze transcripts, track health, and assign tasks with AI."
        }
      },
      "style": {
        "textStyle": {
          "styleName": "body_medium"
        }
      },
      "color": {
        "color": {
          "color": "secondary_text"
        }
      },
      "text_align": {
        "align": {
          "named": "left"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "117e69f4-72c8-492f-887f-133af5ada128",
    "parentKey": "f7ab8d21-80ea-4fcf-9c7c-fe53be4ebf46",
    "label": "column",
    "flutterWidgetType": "Column",
    "semanticRole": "layout_column",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "spacing": {
        "stringVal": {
          "value": "lg"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "e4ae4eb2-5615-4d94-a0b7-f0be673acaa8",
    "parentKey": "117e69f4-72c8-492f-887f-133af5ada128",
    "label": "container",
    "flutterWidgetType": "Container",
    "semanticRole": "layout_container",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "bg": {
        "color": {
          "color": "surface"
        }
      },
      "radius": {
        "radius": {
          "topLeft": 24,
          "topRight": 24,
          "bottomLeft": 24,
          "bottomRight": 24
        }
      },
      "padding": {
        "edgeInsets": {
          "top": 0,
          "right": 0,
          "bottom": 0,
          "left": 0,
          "token": "lg"
        }
      },
      "shadow": {
        "stringVal": {
          "value": "sm"
        }
      },
      "border": {
        "border": {
          "width": 1,
          "color": "divider"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "f0e980e6-3dd3-4fef-a3d3-94dd12f76b0b",
    "parentKey": "e4ae4eb2-5615-4d94-a0b7-f0be673acaa8",
    "label": "column",
    "flutterWidgetType": "Column",
    "semanticRole": "layout_column",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "spacing": {
        "stringVal": {
          "value": "lg"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "a6afb88e-94a7-4bd4-8d8c-ea2cbadf8f74",
    "parentKey": "f0e980e6-3dd3-4fef-a3d3-94dd12f76b0b",
    "label": "Work Email",
    "flutterWidgetType": "TextField",
    "semanticRole": "form_input",
    "pageKey": "page-login",
    "interactive": true,
    "properties": {
      "label": {
        "stringVal": {
          "value": "Work Email"
        }
      },
      "hint": {
        "stringVal": {
          "value": "name@company.com"
        }
      },
      "icon": {
        "stringVal": {
          "value": "email_outlined"
        }
      },
      "is_password": {
        "boolVal": {
          "value": false
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "75f4d2c1-5a09-4424-880b-242b0d69d536",
    "parentKey": "f0e980e6-3dd3-4fef-a3d3-94dd12f76b0b",
    "label": "column",
    "flutterWidgetType": "Column",
    "semanticRole": "layout_column",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "spacing": {
        "stringVal": {
          "value": "xs"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "464d13cd-3527-46bd-ab80-79f97cbd117e",
    "parentKey": "75f4d2c1-5a09-4424-880b-242b0d69d536",
    "label": "Password",
    "flutterWidgetType": "TextField",
    "semanticRole": "form_input",
    "pageKey": "page-login",
    "interactive": true,
    "properties": {
      "label": {
        "stringVal": {
          "value": "Password"
        }
      },
      "hint": {
        "stringVal": {
          "value": "••••••••"
        }
      },
      "icon": {
        "stringVal": {
          "value": "lock_outline_rounded"
        }
      },
      "is_password": {
        "boolVal": {
          "value": true
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "221a8401-ce01-460b-be5d-4c776b23f0f6",
    "parentKey": "75f4d2c1-5a09-4424-880b-242b0d69d536",
    "label": "container",
    "flutterWidgetType": "Container",
    "semanticRole": "layout_container",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "align": {
        "align": {
          "named": "right"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "33cf7636-76ce-49be-aca0-5c46c3a87aad",
    "parentKey": "221a8401-ce01-460b-be5d-4c776b23f0f6",
    "label": "Forgot Password?",
    "flutterWidgetType": "Text",
    "semanticRole": "text_body",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "content": {
        "stringVal": {
          "value": "Forgot Password?"
        }
      },
      "style": {
        "textStyle": {
          "styleName": "label_small"
        }
      },
      "color": {
        "color": {
          "color": "accent"
        }
      },
      "font_weight": {
        "numberVal": {
          "value": 600
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "0741ec14-84b1-4f56-85c5-c90a8c25fe93",
    "parentKey": "f0e980e6-3dd3-4fef-a3d3-94dd12f76b0b",
    "label": "Sign In to Workspace",
    "flutterWidgetType": "Button",
    "semanticRole": "submit_form",
    "pageKey": "page-login",
    "interactive": true,
    "properties": {
      "content": {
        "stringVal": {
          "value": "Sign In to Workspace"
        }
      },
      "icon_end": {
        "icon": {
          "name": "arrow_forward_rounded"
        }
      },
      "size": {
        "stringVal": {
          "value": "large"
        }
      },
      "full_width": {
        "boolVal": {
          "value": true
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "ee2dff0d-5445-4cdb-aa9d-48b5bcdaa7d5",
    "parentKey": "117e69f4-72c8-492f-887f-133af5ada128",
    "label": "row",
    "flutterWidgetType": "Row",
    "semanticRole": "layout_row",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "align": {
        "align": {
          "named": "center"
        }
      },
      "spacing": {
        "stringVal": {
          "value": "md"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "f6cd6d2a-9ce7-4914-bf08-7833bac5620c",
    "parentKey": "ee2dff0d-5445-4cdb-aa9d-48b5bcdaa7d5",
    "label": "Create New Account",
    "flutterWidgetType": "Button",
    "semanticRole": "submit_form",
    "pageKey": "page-login",
    "interactive": true,
    "properties": {
      "content": {
        "stringVal": {
          "value": "Create New Account"
        }
      },
      "variant": {
        "stringVal": {
          "value": "ghost"
        }
      },
      "size": {
        "stringVal": {
          "value": "small"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "fe4612a1-8b13-42eb-b120-2e0a8bdf41fb",
    "parentKey": "ee2dff0d-5445-4cdb-aa9d-48b5bcdaa7d5",
    "label": "container",
    "flutterWidgetType": "Container",
    "semanticRole": "layout_container",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "width": {
        "px": {
          "value": 1,
          "isInfinity": false
        }
      },
      "height": {
        "px": {
          "value": 16,
          "isInfinity": false
        }
      },
      "bg": {
        "color": {
          "color": "divider"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "feb871a4-82f4-43b1-8a91-0a26411240de",
    "parentKey": "ee2dff0d-5445-4cdb-aa9d-48b5bcdaa7d5",
    "label": "Guest Access",
    "flutterWidgetType": "Button",
    "semanticRole": "submit_form",
    "pageKey": "page-login",
    "interactive": true,
    "properties": {
      "content": {
        "stringVal": {
          "value": "Guest Access"
        }
      },
      "variant": {
        "stringVal": {
          "value": "ghost"
        }
      },
      "size": {
        "stringVal": {
          "value": "small"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "797fab12-94d7-46a8-985a-6edbe3236194",
    "parentKey": "f7ab8d21-80ea-4fcf-9c7c-fe53be4ebf46",
    "label": "column",
    "flutterWidgetType": "Column",
    "semanticRole": "layout_column",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "spacing": {
        "stringVal": {
          "value": "md"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "e1692792-f8c4-4ce7-9eff-2e372cfadf55",
    "parentKey": "797fab12-94d7-46a8-985a-6edbe3236194",
    "label": "row",
    "flutterWidgetType": "Row",
    "semanticRole": "layout_row",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "spacing": {
        "stringVal": {
          "value": "md"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "68ed3af5-2320-4dd7-94eb-e7e76c00629e",
    "parentKey": "e1692792-f8c4-4ce7-9eff-2e372cfadf55",
    "label": "expanded",
    "flutterWidgetType": "Expanded",
    "semanticRole": "layout_expanded",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {},
    "dataBindings": []
  },
  {
    "key": "791428d8-475f-49e8-819d-31e557c4e1be",
    "parentKey": "68ed3af5-2320-4dd7-94eb-e7e76c00629e",
    "label": "divider",
    "flutterWidgetType": "Divider",
    "semanticRole": "layout_divider",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "color": {
        "color": {
          "color": "divider"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "b5725407-b692-4ecc-93f7-3310dcf90f90",
    "parentKey": "e1692792-f8c4-4ce7-9eff-2e372cfadf55",
    "label": "OR CONNECT WITH",
    "flutterWidgetType": "Text",
    "semanticRole": "text_body",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "content": {
        "stringVal": {
          "value": "OR CONNECT WITH"
        }
      },
      "style": {
        "textStyle": {
          "styleName": "label_small"
        }
      },
      "color": {
        "color": {
          "color": "hint"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "a24698f8-25c4-4baa-bb8b-d9b517a2bce0",
    "parentKey": "e1692792-f8c4-4ce7-9eff-2e372cfadf55",
    "label": "expanded",
    "flutterWidgetType": "Expanded",
    "semanticRole": "layout_expanded",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {},
    "dataBindings": []
  },
  {
    "key": "97521a38-9c18-4418-94fc-20f8d01c4028",
    "parentKey": "a24698f8-25c4-4baa-bb8b-d9b517a2bce0",
    "label": "divider",
    "flutterWidgetType": "Divider",
    "semanticRole": "layout_divider",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "color": {
        "color": {
          "color": "divider"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "220cf53f-97a5-4afb-9ff0-78d4e7b39e3a",
    "parentKey": "797fab12-94d7-46a8-985a-6edbe3236194",
    "label": "row",
    "flutterWidgetType": "Row",
    "semanticRole": "layout_row",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "spacing": {
        "stringVal": {
          "value": "md"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "d6a5b680-c609-4742-82d7-709875f7492a",
    "parentKey": "220cf53f-97a5-4afb-9ff0-78d4e7b39e3a",
    "label": "Google",
    "flutterWidgetType": "SocialButton",
    "semanticRole": "action_trigger",
    "pageKey": "page-login",
    "interactive": true,
    "properties": {
      "icon": {
        "stringVal": {
          "value": "google"
        }
      },
      "label": {
        "stringVal": {
          "value": "Google"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "a603d44c-d4da-47a4-a77d-2e9e9f0cc722",
    "parentKey": "220cf53f-97a5-4afb-9ff0-78d4e7b39e3a",
    "label": "Apple",
    "flutterWidgetType": "SocialButton",
    "semanticRole": "action_trigger",
    "pageKey": "page-login",
    "interactive": true,
    "properties": {
      "icon": {
        "stringVal": {
          "value": "apple"
        }
      },
      "label": {
        "stringVal": {
          "value": "Apple"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "c87e37e0-cedb-49ce-a5ef-3f02f085573b",
    "parentKey": "f7ab8d21-80ea-4fcf-9c7c-fe53be4ebf46",
    "label": "container",
    "flutterWidgetType": "Container",
    "semanticRole": "layout_container",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "bg": {
        "color": {
          "color": "surface"
        }
      },
      "radius": {
        "radius": {
          "topLeft": 24,
          "topRight": 24,
          "bottomLeft": 24,
          "bottomRight": 24
        }
      },
      "padding": {
        "edgeInsets": {
          "top": 0,
          "right": 0,
          "bottom": 0,
          "left": 0,
          "token": "lg"
        }
      },
      "border": {
        "border": {
          "width": 1,
          "color": "divider"
        }
      },
      "shadow": {
        "stringVal": {
          "value": "md"
        }
      },
      "clip": {
        "boolVal": {
          "value": true
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "6f65cf3f-4b93-43b5-898a-4d6d9ccf6d91",
    "parentKey": "c87e37e0-cedb-49ce-a5ef-3f02f085573b",
    "label": "stack",
    "flutterWidgetType": "Stack",
    "semanticRole": "layout_stack",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {},
    "dataBindings": []
  },
  {
    "key": "03b6eb5e-a113-461d-9f1e-bb4163fa920c",
    "parentKey": "6f65cf3f-4b93-43b5-898a-4d6d9ccf6d91",
    "label": "container",
    "flutterWidgetType": "Container",
    "semanticRole": "layout_container",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "align": {
        "align": {
          "named": "right"
        }
      },
      "opacity": {
        "numberVal": {
          "value": 0.05
        }
      },
      "transform_rotate": {
        "numberVal": {
          "value": 15
        }
      },
      "margin": {
        "edgeInsets": {
          "top": 0,
          "right": 0,
          "bottom": 0,
          "left": 0
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "709e8d3b-344c-43e2-8fe4-d39c2530ff80",
    "parentKey": "03b6eb5e-a113-461d-9f1e-bb4163fa920c",
    "label": "waves_rounded",
    "flutterWidgetType": "Icon",
    "semanticRole": "icon",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "name": {
        "icon": {
          "name": "waves_rounded"
        }
      },
      "size": {
        "numberVal": {
          "value": 140
        }
      },
      "color": {
        "color": {
          "color": "primary"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "7e91abec-be17-40c5-8cf5-3ad09bd39069",
    "parentKey": "6f65cf3f-4b93-43b5-898a-4d6d9ccf6d91",
    "label": "row",
    "flutterWidgetType": "Row",
    "semanticRole": "layout_row",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "spacing": {
        "stringVal": {
          "value": "md"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "41333642-2c96-4b0d-8ccd-53561a7d642b",
    "parentKey": "7e91abec-be17-40c5-8cf5-3ad09bd39069",
    "label": "container",
    "flutterWidgetType": "Container",
    "semanticRole": "layout_container",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "width": {
        "px": {
          "value": 56,
          "isInfinity": false
        }
      },
      "height": {
        "px": {
          "value": 56,
          "isInfinity": false
        }
      },
      "bg": {
        "color": {
          "color": "primary"
        }
      },
      "radius": {
        "radius": {
          "topLeft": 16,
          "topRight": 16,
          "bottomLeft": 16,
          "bottomRight": 16
        }
      },
      "align_child": {
        "align": {
          "named": "center"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "a242c2c2-4c65-453c-a4f5-d51bdb6e19b1",
    "parentKey": "41333642-2c96-4b0d-8ccd-53561a7d642b",
    "label": "psychology_rounded",
    "flutterWidgetType": "Icon",
    "semanticRole": "icon",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "name": {
        "icon": {
          "name": "psychology_rounded"
        }
      },
      "color": {
        "color": {
          "color": "on_primary"
        }
      },
      "size": {
        "numberVal": {
          "value": 28
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "12a44983-2e3f-47b9-8683-d02a61bd2ab9",
    "parentKey": "7e91abec-be17-40c5-8cf5-3ad09bd39069",
    "label": "expanded",
    "flutterWidgetType": "Expanded",
    "semanticRole": "layout_expanded",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {},
    "dataBindings": []
  },
  {
    "key": "005b57d7-3649-4164-8d59-ede944e335e6",
    "parentKey": "12a44983-2e3f-47b9-8683-d02a61bd2ab9",
    "label": "column",
    "flutterWidgetType": "Column",
    "semanticRole": "layout_column",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "cross_align": {
        "align": {
          "named": "start"
        }
      },
      "spacing": {
        "stringVal": {
          "value": "xs"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "3fe2370b-1cc4-49b0-a8cf-977087a5d7c8",
    "parentKey": "005b57d7-3649-4164-8d59-ede944e335e6",
    "label": "row",
    "flutterWidgetType": "Row",
    "semanticRole": "layout_row",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "spacing": {
        "stringVal": {
          "value": "xs"
        }
      },
      "cross_align": {
        "align": {
          "named": "center"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "fd0443c5-fe7a-4100-87ea-f0cffafcd715",
    "parentKey": "3fe2370b-1cc4-49b0-a8cf-977087a5d7c8",
    "label": "EchoAnalyze Pro",
    "flutterWidgetType": "Text",
    "semanticRole": "text_body",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "content": {
        "stringVal": {
          "value": "EchoAnalyze Pro"
        }
      },
      "style": {
        "textStyle": {
          "styleName": "title_medium"
        }
      },
      "color": {
        "color": {
          "color": "primary_text"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "0fb1bd37-707b-4376-a07b-0c8c97ea1acf",
    "parentKey": "3fe2370b-1cc4-49b0-a8cf-977087a5d7c8",
    "label": "container",
    "flutterWidgetType": "Container",
    "semanticRole": "layout_container",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "bg": {
        "color": {
          "color": "accent"
        }
      },
      "radius": {
        "radius": {
          "topLeft": 4,
          "topRight": 4,
          "bottomLeft": 4,
          "bottomRight": 4
        }
      },
      "padding": {
        "edgeInsets": {
          "top": 4,
          "right": 2,
          "bottom": 4,
          "left": 2
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "42265a11-a19f-486e-9e04-f6dbd58036e9",
    "parentKey": "0fb1bd37-707b-4376-a07b-0c8c97ea1acf",
    "label": "NEW",
    "flutterWidgetType": "Text",
    "semanticRole": "text_body",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "content": {
        "stringVal": {
          "value": "NEW"
        }
      },
      "style": {
        "textStyle": {
          "styleName": "label_small"
        }
      },
      "color": {
        "color": {
          "color": "primary_text"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "6ee993e9-91db-4fbe-bdde-4fc4d3e29f83",
    "parentKey": "005b57d7-3649-4164-8d59-ede944e335e6",
    "label": "Real-time sentiment analysis and automated task extraction for your team.",
    "flutterWidgetType": "Text",
    "semanticRole": "text_body",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "content": {
        "stringVal": {
          "value": "Real-time sentiment analysis and automated task extraction for your team."
        }
      },
      "style": {
        "textStyle": {
          "styleName": "body_small"
        }
      },
      "color": {
        "color": {
          "color": "secondary_text"
        }
      },
      "max_lines": {
        "numberVal": {
          "value": 2
        }
      },
      "overflow": {
        "stringVal": {
          "value": "ellipsis"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "a4d58571-2fb1-4fec-9925-6df4caf975a6",
    "parentKey": "f7ab8d21-80ea-4fcf-9c7c-fe53be4ebf46",
    "label": "column",
    "flutterWidgetType": "Column",
    "semanticRole": "layout_column",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "spacing": {
        "stringVal": {
          "value": "sm"
        }
      },
      "align": {
        "align": {
          "named": "center"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "bb0c2cf7-99e9-4221-b3cd-61a2c45495f9",
    "parentKey": "a4d58571-2fb1-4fec-9925-6df4caf975a6",
    "label": "By continuing, you agree to our Terms of Service",
    "flutterWidgetType": "Text",
    "semanticRole": "text_body",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "content": {
        "stringVal": {
          "value": "By continuing, you agree to our Terms of Service"
        }
      },
      "style": {
        "textStyle": {
          "styleName": "label_small"
        }
      },
      "color": {
        "color": {
          "color": "hint"
        }
      },
      "text_align": {
        "align": {
          "named": "center"
        }
      }
    },
    "dataBindings": []
  },
  {
    "key": "2035ffe3-8078-42d8-b9dd-067941fb911b",
    "parentKey": "a4d58571-2fb1-4fec-9925-6df4caf975a6",
    "label": "sizedbox",
    "flutterWidgetType": "Sizedbox",
    "semanticRole": "component",
    "pageKey": "page-login",
    "interactive": false,
    "properties": {
      "height": {
        "stringVal": {
          "value": "md"
        }
      }
    },
    "dataBindings": []
  },
  {
      "key": "w-scaffold-transcription",
      "parentKey": null,
      "flutterWidgetType": "Scaffold",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-safe-area-transcription",
      "parentKey": "w-scaffold-transcription",
      "flutterWidgetType": "SafeArea",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-main-col-transcription",
      "parentKey": "w-safe-area-transcription",
      "flutterWidgetType": "Column",
      "pageKey": "page-live-transcription",
      "properties": {
        "main_align": { "align": { "named": "start" } },
        "cross_align": { "align": { "named": "stretch" } }
      }
    },
    {
      "key": "w-header-container",
      "parentKey": "w-main-col-transcription",
      "flutterWidgetType": "Container",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-header-row",
      "parentKey": "w-header-container",
      "flutterWidgetType": "Row",
      "pageKey": "page-live-transcription",
      "properties": {
        "align": { "align": { "named": "spaceBetween" } }
      }
    },
    {
      "key": "w-status-col",
      "parentKey": "w-header-row",
      "flutterWidgetType": "Column",
      "pageKey": "page-live-transcription",
      "properties": {
        "cross_align": { "align": { "named": "start" } }
      }
    },
    {
      "key": "w-status-row",
      "parentKey": "w-status-col",
      "flutterWidgetType": "Row",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-recording-dot",
      "parentKey": "w-status-row",
      "flutterWidgetType": "Container",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-recording-text",
      "parentKey": "w-status-row",
      "flutterWidgetType": "Text",
      "label": "RECORDING",
      "pageKey": "page-live-transcription",
      "properties": {
        "content": { "stringVal": { "value": "RECORDING" } },
        "color": { "color": { "color": "error" } }
      }
    },
    {
      "key": "w-health-metrics-container",
      "parentKey": "w-main-col-transcription",
      "flutterWidgetType": "Container",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-health-row",
      "parentKey": "w-health-metrics-container",
      "flutterWidgetType": "Row",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
       "key": "w-health-box-timer",
       "parentKey": "w-health-row",
       "flutterWidgetType": "Container",
       "pageKey": "page-live-transcription",
       "properties": {}
    },
    {
       "key": "w-timer-text",
       "parentKey": "w-health-box-timer",
       "flutterWidgetType": "Text",
       "label": "Duration",
       "pageKey": "page-live-transcription",
       "properties": { "content": { "stringVal": { "value": "Duration" } } }
    },
    {
      "key": "w-bubbles-expanded",
      "parentKey": "w-main-col-transcription",
      "flutterWidgetType": "Expanded",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-bubble-component-1",
      "parentKey": "w-bubbles-expanded",
      "flutterWidgetType": "TranscriptionBubble2Widget",
      "pageKey": "page-live-transcription",
      "properties": {
         "speaker": "Sarah Chen",
         "message": "The roadmap for Q4 looks solid, but we need to address the technical debt in the legacy API before scaling."
      }
    },
    {
      "key": "w-action-items-container",
      "parentKey": "w-main-col-transcription",
      "flutterWidgetType": "Container",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-action-items-text",
      "parentKey": "w-action-items-container",
      "flutterWidgetType": "Text",
      "label": "Detected Action Items",
      "pageKey": "page-live-transcription",
      "properties": { "content": { "stringVal": { "value": "Detected Action Items" } } }
    },
    {
      "key": "w-footer-container",
      "parentKey": "w-main-col-transcription",
      "flutterWidgetType": "Container",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-footer-row",
      "parentKey": "w-footer-container",
      "flutterWidgetType": "Row",
      "pageKey": "page-live-transcription",
      "properties": { "align": { "align": { "named": "spaceBetween" } } }
    },
    {
      "key": "w-timer-widget",
      "parentKey": "w-footer-row",
      "flutterWidgetType": "FlutterFlowTimer",
      "pageKey": "page-live-transcription",
      "properties": { "text": "00:00:00" }
    },
    {
      "key": "w-recording-btn-stack",
      "parentKey": "w-footer-row",
      "flutterWidgetType": "Stack",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-blur-overlay",
      "parentKey": "w-recording-btn-stack",
      "flutterWidgetType": "ImageFiltered",
      "pageKey": "page-live-transcription",
      "properties": {
        "blurSigma": 8
      }
    },
    {
      "key": "w-blur-bg-box",
      "parentKey": "w-blur-overlay",
      "flutterWidgetType": "Container",
      "pageKey": "page-live-transcription",
      "properties": {}
    },
    {
      "key": "w-record-stop-btn",
      "parentKey": "w-recording-btn-stack",
      "flutterWidgetType": "Container",
      "pageKey": "page-live-transcription",
      "properties": {}
    }
],
  navigationEdges: [],
  sourceLinks: [],
  unknowns: []
};

export const mockWiringPlan = {
  actionFlows: [] as any[],
  flowSteps: [] as any[],
  readBindings: [] as any[],
  mutationBindings: [] as any[],
  uploadBindings: [] as any[],
  navigationBindings: [] as any[],
  functionBindings: [] as any[],
  stateTransitions: [] as any[],
  debugBindings: [] as any[],
  guards: [] as any[],
  unknowns: [],
  validation: { executionReady: true }
};
