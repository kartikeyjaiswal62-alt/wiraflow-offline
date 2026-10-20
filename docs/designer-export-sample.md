# Design Export Context

- Generated at: `2026-04-14T17:27:45.749Z`
- Document ID: `7ddf2dc1-6afd-46b8-a4e9-96f6a5559f61`
- Page count: 1

## Original Prompt

```text
use the atttached design theme and create ui of meeting analysis app with audio transcriotion and analysis of the meeting. Assignment and analysis of the tasks of the every users, meeting health. Users scores,etc accordingly
```

## Theme (JSON)

```json
{
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
}
```

## Pages

### 1. Live Transcription

- Frame ID: `2c1e0c83-86a5-4941-8d52-59b9b1d3a2f3`
- Original page prompt: "A recording screen with real-time audio transcription and speaker identification."
- Follow-up prompts: _None_

#### DslDocument (JSON)

```json
{
  "root": {
    "type": "scaffold",
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
    "children": [
      {
        "type": "column",
        "properties": {
          "cross_align": {
            "align": {
              "named": "stretch"
            }
          }
        },
        "children": [
          {
            "type": "container",
            "properties": {
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
                "borderSided": {
                  "side": "bottom",
                  "width": 1,
                  "color": "divider"
                }
              },
              "bg": {
                "color": {
                  "color": "surface"
                }
              }
            },
            "children": [
              {
                "type": "row",
                "properties": {
                  "align": {
                    "align": {
                      "named": "space_between"
                    }
                  }
                },
                "children": [
                  {
                    "type": "column",
                    "properties": {
                      "cross_align": {
                        "align": {
                          "named": "start"
                        }
                      },
                      "spacing": {
                        "numberVal": {
                          "value": 4
                        }
                      }
                    },
                    "children": [
                      {
                        "type": "row",
                        "properties": {
                          "spacing": {
                            "stringVal": {
                              "value": "sm"
                            }
                          }
                        },
                        "children": [
                          {
                            "type": "container",
                            "properties": {
                              "width": {
                                "px": {
                                  "value": 8,
                                  "isInfinity": false
                                }
                              },
                              "height": {
                                "px": {
                                  "value": 8,
                                  "isInfinity": false
                                }
                              },
                              "bg": {
                                "color": {
                                  "color": "error"
                                }
                              },
                              "radius": {
                                "radius": {
                                  "topLeft": 4,
                                  "topRight": 4,
                                  "bottomLeft": 4,
                                  "bottomRight": 4
                                }
                              }
                            },
                            "editorId": "aef4053d-a9d2-4d4d-9c1f-5316e857b5ea"
                          },
                          {
                            "type": "text",
                            "properties": {
                              "content": {
                                "stringVal": {
                                  "value": "LIVE RECORDING"
                                }
                              },
                              "style": {
                                "textStyle": {
                                  "styleName": "label_small"
                                }
                              },
                              "color": {
                                "color": {
                                  "color": "error"
                                }
                              },
                              "font_weight": {
                                "stringVal": {
                                  "value": "bold"
                                }
                              }
                            },
                            "editorId": "79a72e4d-f52a-4930-aef4-78ddc5113cdc"
                          }
                        ],
                        "editorId": "f6c847e2-ea65-4cf3-9acb-e5283280620a"
                      },
                      {
                        "type": "text",
                        "properties": {
                          "content": {
                            "stringVal": {
                              "value": "Q3 Product Strategy Sync"
                            }
                          },
                          "style": {
                            "textStyle": {
                              "styleName": "title_medium"
                            }
                          },
                          "font_weight": {
                            "numberVal": {
                              "value": 700
                            }
                          }
                        },
                        "editorId": "ce930508-545c-4971-93c9-4b717d47030f"
                      }
                    ],
                    "editorId": "4e4d4196-2b91-46b3-84f4-4193547a550d"
                  },
                  {
                    "type": "iconbutton",
                    "properties": {
                      "name": {
                        "icon": {
                          "name": "settings_rounded"
                        }
                      },
                      "color": {
                        "color": {
                          "color": "secondary_text"
                        }
                      },
                      "size": {
                        "numberVal": {
                          "value": 20
                        }
                      }
                    },
                    "editorId": "6562aa82-e18f-4361-839a-4ebc4f6ca8fb"
                  }
                ],
                "editorId": "0b928f19-4b02-422f-93e6-91cec4090958"
              }
            ],
            "editorId": "f898f451-39ef-418c-a223-3bd25827ffb3"
          },
          {
            "type": "row",
            "properties": {
              "padding": {
                "edgeInsets": {
                  "top": 0,
                  "right": 0,
                  "bottom": 0,
                  "left": 0,
                  "topToken": "md",
                  "rightToken": "lg",
                  "bottomToken": "md",
                  "leftToken": "lg"
                }
              },
              "spacing": {
                "stringVal": {
                  "value": "md"
                }
              },
              "scroll": {
                "boolVal": {
                  "value": true
                }
              }
            },
            "children": [
              {
                "type": "@status_chip",
                "properties": {
                  "icon": {
                    "stringVal": {
                      "value": "timer_rounded"
                    }
                  },
                  "label": {
                    "stringVal": {
                      "value": "Duration"
                    }
                  },
                  "value": {
                    "stringVal": {
                      "value": "42:18"
                    }
                  },
                  "color": {
                    "stringVal": {
                      "value": "primary"
                    }
                  }
                },
                "editorId": "d1c7c293-e1a1-42cf-9704-098a17eb5343"
              },
              {
                "type": "@status_chip",
                "properties": {
                  "icon": {
                    "stringVal": {
                      "value": "favorite_rounded"
                    }
                  },
                  "label": {
                    "stringVal": {
                      "value": "Health"
                    }
                  },
                  "value": {
                    "stringVal": {
                      "value": "92%"
                    }
                  },
                  "color": {
                    "stringVal": {
                      "value": "success"
                    }
                  }
                },
                "editorId": "ee4f000c-6c92-4bc3-bdf9-f78f3cd1b7fd"
              },
              {
                "type": "@status_chip",
                "properties": {
                  "icon": {
                    "stringVal": {
                      "value": "psychology_rounded"
                    }
                  },
                  "label": {
                    "stringVal": {
                      "value": "Sentiment"
                    }
                  },
                  "value": {
                    "stringVal": {
                      "value": "Positive"
                    }
                  },
                  "color": {
                    "stringVal": {
                      "value": "accent"
                    }
                  }
                },
                "editorId": "13baff5b-70e2-4a68-b0ad-b82cf401a70d"
              }
            ],
            "editorId": "724a7cc6-135e-4b27-9adf-d3947b0316c2"
          },
          {
            "type": "expanded",
            "children": [
              {
                "type": "column",
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
                      "value": "md"
                    }
                  }
                },
                "children": [
                  {
                    "type": "@transcription_bubble",
                    "properties": {
                      "speaker": {
                        "stringVal": {
                          "value": "Sarah Chen"
                        }
                      },
                      "initials": {
                        "stringVal": {
                          "value": "SC"
                        }
                      },
                      "message": {
                        "stringVal": {
                          "value": "The roadmap for Q4 looks solid, but we need to address the technical debt in the legacy API before scaling."
                        }
                      },
                      "is_me": {
                        "boolVal": {
                          "value": false
                        }
                      },
                      "is_active": {
                        "boolVal": {
                          "value": false
                        }
                      }
                    },
                    "editorId": "353ac9b7-9133-41be-9c52-b2d0117c2730"
                  },
                  {
                    "type": "@transcription_bubble",
                    "properties": {
                      "speaker": {
                        "stringVal": {
                          "value": "Marcus Wright"
                        }
                      },
                      "initials": {
                        "stringVal": {
                          "value": "MW"
                        }
                      },
                      "message": {
                        "stringVal": {
                          "value": "I agree. If we don't refactor the authentication module now, it'll haunt us during the global rollout."
                        }
                      },
                      "is_me": {
                        "boolVal": {
                          "value": false
                        }
                      },
                      "is_active": {
                        "boolVal": {
                          "value": false
                        }
                      }
                    },
                    "editorId": "a4d644f6-eb58-479b-8147-d94a28785b28"
                  },
                  {
                    "type": "@transcription_bubble",
                    "properties": {
                      "speaker": {
                        "stringVal": {
                          "value": "You"
                        }
                      },
                      "initials": {
                        "stringVal": {
                          "value": "ME"
                        }
                      },
                      "message": {
                        "stringVal": {
                          "value": "What's the estimated timeline for that refactor? We need to balance this with the new feature requests."
                        }
                      },
                      "is_me": {
                        "boolVal": {
                          "value": true
                        }
                      },
                      "is_active": {
                        "boolVal": {
                          "value": false
                        }
                      }
                    },
                    "editorId": "c9788fb6-0f0a-44e1-baaa-961b66082a7c"
                  },
                  {
                    "type": "@transcription_bubble",
                    "properties": {
                      "speaker": {
                        "stringVal": {
                          "value": "Sarah Chen"
                        }
                      },
                      "initials": {
                        "stringVal": {
                          "value": "SC"
                        }
                      },
                      "message": {
                        "stringVal": {
                          "value": "I'm looking at the logs now. It seems like the bottleneck is in the DB connection pooling..."
                        }
                      },
                      "is_me": {
                        "boolVal": {
                          "value": false
                        }
                      },
                      "is_active": {
                        "boolVal": {
                          "value": true
                        }
                      }
                    },
                    "editorId": "9626c797-4c96-49d1-a81d-2874b7d7445e"
                  },
                  {
                    "type": "container",
                    "properties": {
                      "padding": {
                        "edgeInsets": {
                          "top": 0,
                          "right": 0,
                          "bottom": 0,
                          "left": 0,
                          "token": "md"
                        }
                      },
                      "align_child": {
                        "align": {
                          "named": "center"
                        }
                      }
                    },
                    "children": [
                      {
                        "type": "row",
                        "properties": {
                          "spacing": {
                            "stringVal": {
                              "value": "xs"
                            }
                          }
                        },
                        "children": [
                          {
                            "type": "progress",
                            "properties": {
                              "variant": {
                                "stringVal": {
                                  "value": "circular"
                                }
                              },
                              "size": {
                                "numberVal": {
                                  "value": 12
                                }
                              },
                              "thickness": {
                                "numberVal": {
                                  "value": 2
                                }
                              },
                              "color": {
                                "color": {
                                  "color": "hint"
                                }
                              }
                            },
                            "editorId": "9584b25c-1665-4fb1-8e4a-d5c9d3679dd4"
                          },
                          {
                            "type": "text",
                            "properties": {
                              "content": {
                                "stringVal": {
                                  "value": "AI is transcribing..."
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
                            "editorId": "5c6f4116-b93e-4321-9b9f-2b700b89bbe2"
                          }
                        ],
                        "editorId": "0405858a-c4e2-4a78-b3ca-e9a3e1b3c0e3"
                      }
                    ],
                    "editorId": "eb497014-ae40-4bc1-bbd8-95f381372ac4"
                  }
                ],
                "editorId": "0deb1daa-3294-4061-a380-f6624d336195"
              }
            ],
            "editorId": "d465a292-a15e-429d-a677-77117c33a01a"
          },
          {
            "type": "container",
            "properties": {
              "bg": {
                "color": {
                  "color": "surface"
                }
              },
              "border": {
                "borderSided": {
                  "side": "top",
                  "width": 1,
                  "color": "divider"
                }
              },
              "padding": {
                "edgeInsets": {
                  "top": 0,
                  "right": 0,
                  "bottom": 0,
                  "left": 0,
                  "topToken": "md",
                  "rightToken": "lg",
                  "bottomToken": "md",
                  "leftToken": "lg"
                }
              }
            },
            "children": [
              {
                "type": "column",
                "properties": {
                  "cross_align": {
                    "align": {
                      "named": "stretch"
                    }
                  },
                  "spacing": {
                    "stringVal": {
                      "value": "md"
                    }
                  }
                },
                "children": [
                  {
                    "type": "column",
                    "properties": {
                      "spacing": {
                        "stringVal": {
                          "value": "sm"
                        }
                      },
                      "cross_align": {
                        "align": {
                          "named": "stretch"
                        }
                      }
                    },
                    "children": [
                      {
                        "type": "text",
                        "properties": {
                          "content": {
                            "stringVal": {
                              "value": "Meeting Title"
                            }
                          },
                          "style": {
                            "textStyle": {
                              "styleName": "label_large"
                            }
                          },
                          "font_weight": {
                            "numberVal": {
                              "value": 700
                            }
                          },
                          "color": {
                            "color": {
                              "color": "primary_text"
                            }
                          }
                        },
                        "editorId": "5d37f0a9-3ee6-4fd2-9066-fbcbe5d3924d"
                      },
                      {
                        "type": "@std.textfield",
                        "properties": {
                          "variant": {
                            "stringVal": {
                              "value": "outlined"
                            }
                          },
                          "hint": {
                            "stringVal": {
                              "value": "Enter title to categorize analysis"
                            }
                          },
                          "value": {
                            "stringVal": {
                              "value": "Q3 Product Strategy Sync"
                            }
                          },
                          "leading_icon": {
                            "stringVal": {
                              "value": "edit_note_rounded"
                            }
                          }
                        },
                        "editorId": "1dfc9175-3d2b-43bb-8fd9-ca62bf1efca0"
                      }
                    ],
                    "editorId": "d6a6dbb7-218a-4b16-9106-63c696cf4d3c"
                  },
                  {
                    "type": "column",
                    "properties": {
                      "spacing": {
                        "stringVal": {
                          "value": "sm"
                        }
                      }
                    },
                    "children": [
                      {
                        "type": "row",
                        "properties": {
                          "align": {
                            "align": {
                              "named": "space_between"
                            }
                          }
                        },
                        "children": [
                          {
                            "type": "text",
                            "properties": {
                              "content": {
                                "stringVal": {
                                  "value": "Detected Action Items"
                                }
                              },
                              "style": {
                                "textStyle": {
                                  "styleName": "label_large"
                                }
                              },
                              "font_weight": {
                                "numberVal": {
                                  "value": 700
                                }
                              },
                              "color": {
                                "color": {
                                  "color": "primary_text"
                                }
                              }
                            },
                            "editorId": "aebc0b9b-6291-4d52-ac77-fd3efabcefc3"
                          },
                          {
                            "type": "text",
                            "properties": {
                              "content": {
                                "stringVal": {
                                  "value": "3 found"
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
                              }
                            },
                            "editorId": "cc259cc6-8f2a-4da4-adb9-b2fc994fc1db"
                          }
                        ],
                        "editorId": "268cc89f-cbb1-4271-a802-67ff40e7d9b2"
                      },
                      {
                        "type": "container",
                        "properties": {
                          "bg": {
                            "color": {
                              "color": "background"
                            }
                          },
                          "radius": {
                            "radius": {
                              "topLeft": 0,
                              "topRight": 0,
                              "bottomLeft": 0,
                              "bottomRight": 0,
                              "token": "lg"
                            }
                          },
                          "padding": {
                            "edgeInsets": {
                              "top": 0,
                              "right": 0,
                              "bottom": 0,
                              "left": 0,
                              "token": "md"
                            }
                          },
                          "border": {
                            "border": {
                              "width": 1,
                              "color": "divider"
                            }
                          }
                        },
                        "children": [
                          {
                            "type": "row",
                            "properties": {
                              "spacing": {
                                "stringVal": {
                                  "value": "md"
                                }
                              }
                            },
                            "children": [
                              {
                                "type": "icon",
                                "properties": {
                                  "name": {
                                    "icon": {
                                      "name": "task_alt_rounded"
                                    }
                                  },
                                  "color": {
                                    "color": {
                                      "color": "success"
                                    }
                                  },
                                  "size": {
                                    "numberVal": {
                                      "value": 18
                                    }
                                  }
                                },
                                "editorId": "3bf910c9-4b36-46cf-bf8b-a3b4a123f8b9"
                              },
                              {
                                "type": "expanded",
                                "children": [
                                  {
                                    "type": "text",
                                    "properties": {
                                      "content": {
                                        "stringVal": {
                                          "value": "Marcus to provide refactor estimate by EOD Friday"
                                        }
                                      },
                                      "style": {
                                        "textStyle": {
                                          "styleName": "body_small"
                                        }
                                      },
                                      "color": {
                                        "color": {
                                          "color": "primary_text"
                                        }
                                      },
                                      "max_lines": {
                                        "numberVal": {
                                          "value": 1
                                        }
                                      },
                                      "overflow": {
                                        "stringVal": {
                                          "value": "ellipsis"
                                        }
                                      }
                                    },
                                    "editorId": "ecd176be-9044-4544-aa63-63ad422c5a28"
                                  }
                                ],
                                "editorId": "0e8fee02-7a02-4545-b0cc-2084f5e41a55"
                              }
                            ],
                            "editorId": "249de6e6-1b8b-4321-8ddc-9b7c17150ffc"
                          }
                        ],
                        "editorId": "ca445db4-54a6-4d32-9ba0-a184bf37631f"
                      }
                    ],
                    "editorId": "9b9a45d1-fb29-4d5a-a1ef-7b584cadbf3d"
                  },
                  {
                    "type": "container",
                    "properties": {
                      "bg": {
                        "color": {
                          "color": "background"
                        }
                      },
                      "radius": {
                        "radius": {
                          "topLeft": 0,
                          "topRight": 0,
                          "bottomLeft": 0,
                          "bottomRight": 0,
                          "token": "lg"
                        }
                      },
                      "padding": {
                        "edgeInsets": {
                          "top": 0,
                          "right": 0,
                          "bottom": 0,
                          "left": 0,
                          "topToken": "sm",
                          "rightToken": "md",
                          "bottomToken": "sm",
                          "leftToken": "md"
                        }
                      },
                      "border": {
                        "border": {
                          "width": 1,
                          "color": "divider"
                        }
                      }
                    },
                    "children": [
                      {
                        "type": "row",
                        "properties": {
                          "spacing": {
                            "stringVal": {
                              "value": "md"
                            }
                          }
                        },
                        "children": [
                          {
                            "type": "container",
                            "properties": {
                              "width": {
                                "px": {
                                  "value": 32,
                                  "isInfinity": false
                                }
                              },
                              "height": {
                                "px": {
                                  "value": 32,
                                  "isInfinity": false
                                }
                              },
                              "bg": {
                                "color": {
                                  "color": "accent"
                                }
                              },
                              "radius": {
                                "radius": {
                                  "topLeft": 0,
                                  "topRight": 0,
                                  "bottomLeft": 0,
                                  "bottomRight": 0,
                                  "token": "md"
                                }
                              },
                              "align_child": {
                                "align": {
                                  "named": "center"
                                }
                              }
                            },
                            "children": [
                              {
                                "type": "icon",
                                "properties": {
                                  "name": {
                                    "icon": {
                                      "name": "audio_file_rounded"
                                    }
                                  },
                                  "color": {
                                    "color": {
                                      "color": "primary_text"
                                    }
                                  },
                                  "size": {
                                    "numberVal": {
                                      "value": 16
                                    }
                                  }
                                },
                                "editorId": "aaab352d-e75c-4473-8be8-9b87956b4744"
                              }
                            ],
                            "editorId": "52a9ed57-9edd-4be4-adee-a212f956c11d"
                          },
                          {
                            "type": "expanded",
                            "children": [
                              {
                                "type": "column",
                                "properties": {
                                  "cross_align": {
                                    "align": {
                                      "named": "start"
                                    }
                                  },
                                  "spacing": {
                                    "numberVal": {
                                      "value": 2
                                    }
                                  }
                                },
                                "children": [
                                  {
                                    "type": "text",
                                    "properties": {
                                      "content": {
                                        "stringVal": {
                                          "value": "Strategy_Sync_Audio_v2.mp3"
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
                                      },
                                      "max_lines": {
                                        "numberVal": {
                                          "value": 1
                                        }
                                      },
                                      "overflow": {
                                        "stringVal": {
                                          "value": "ellipsis"
                                        }
                                      }
                                    },
                                    "editorId": "a542c92a-a243-475d-9715-a6a6b967bd43"
                                  },
                                  {
                                    "type": "text",
                                    "properties": {
                                      "content": {
                                        "stringVal": {
                                          "value": "12.4 MB • Uploaded 2m ago"
                                        }
                                      },
                                      "style": {
                                        "textStyle": {
                                          "styleName": "label_small"
                                        }
                                      },
                                      "font_size": {
                                        "numberVal": {
                                          "value": 10
                                        }
                                      },
                                      "color": {
                                        "color": {
                                          "color": "secondary_text"
                                        }
                                      }
                                    },
                                    "editorId": "fa9da521-dff7-4ce8-95be-204ffdf6d15f"
                                  }
                                ],
                                "editorId": "75a3f926-a255-4b93-a783-e4add2faf3f9"
                              }
                            ],
                            "editorId": "26a3e57e-893b-4f8a-bba2-f2951b2d78e7"
                          },
                          {
                            "type": "iconbutton",
                            "properties": {
                              "name": {
                                "icon": {
                                  "name": "close_rounded"
                                }
                              },
                              "size": {
                                "numberVal": {
                                  "value": 16
                                }
                              },
                              "color": {
                                "color": {
                                  "color": "hint"
                                }
                              }
                            },
                            "editorId": "bcb1f6db-db32-4965-aa2e-b72c7275d7a8"
                          }
                        ],
                        "editorId": "fd4328a2-abc8-4b4a-a1d2-d136ab76d155"
                      }
                    ],
                    "editorId": "a3fac202-8ac0-499a-96aa-450d108dd32a"
                  }
                ],
                "editorId": "47a916d0-a98f-4021-a84d-5a8d50c2bb81"
              }
            ],
            "editorId": "e45015a6-9a6c-48a4-adfa-7572d9b55c73"
          },
          {
            "type": "container",
            "properties": {
              "bg": {
                "color": {
                  "color": "surface"
                }
              },
              "padding": {
                "edgeInsets": {
                  "top": 0,
                  "right": 0,
                  "bottom": 0,
                  "left": 0,
                  "topToken": "md",
                  "rightToken": "lg",
                  "bottomToken": "md",
                  "leftToken": "lg"
                }
              },
              "border": {
                "borderSided": {
                  "side": "top",
                  "width": 1,
                  "color": "divider"
                }
              }
            },
            "children": [
              {
                "type": "@std.button",
                "properties": {
                  "content": {
                    "stringVal": {
                      "value": "Analyze Meeting Insights"
                    }
                  },
                  "icon": {
                    "stringVal": {
                      "value": "auto_awesome_rounded"
                    }
                  },
                  "size": {
                    "stringVal": {
                      "value": "small"
                    }
                  },
                  "full_width": {
                    "boolVal": {
                      "value": true
                    }
                  }
                },
                "editorId": "d4d5d829-0597-4729-9e79-99cbf3cd5dd7"
              }
            ],
            "editorId": "f18135d2-f94f-4bb6-ad79-b43161e82eb3"
          },
          {
            "type": "container",
            "properties": {
              "bg": {
                "color": {
                  "color": "surface"
                }
              },
              "padding": {
                "edgeInsets": {
                  "top": 0,
                  "right": 0,
                  "bottom": 0,
                  "left": 0,
                  "topToken": "md",
                  "rightToken": "lg",
                  "bottomToken": "xl",
                  "leftToken": "lg"
                }
              },
              "border": {
                "borderSided": {
                  "side": "top",
                  "width": 1,
                  "color": "divider"
                }
              }
            },
            "children": [
              {
                "type": "column",
                "properties": {
                  "spacing": {
                    "stringVal": {
                      "value": "md"
                    }
                  }
                },
                "children": [
                  {
                    "type": "stack",
                    "children": [
                      {
                        "type": "container",
                        "properties": {
                          "width": {
                            "px": {
                              "value": "Infinity",
                              "isInfinity": true
                            }
                          },
                          "height": {
                            "px": {
                              "value": 4,
                              "isInfinity": false
                            }
                          },
                          "bg": {
                            "color": {
                              "color": "divider"
                            }
                          },
                          "radius": {
                            "radius": {
                              "topLeft": 2,
                              "topRight": 2,
                              "bottomLeft": 2,
                              "bottomRight": 2
                            }
                          }
                        },
                        "editorId": "d40af414-7d32-4893-8f6f-f8522917c6c2"
                      },
                      {
                        "type": "container",
                        "properties": {
                          "width": {
                            "percent": {
                              "value": 65
                            }
                          },
                          "height": {
                            "px": {
                              "value": 4,
                              "isInfinity": false
                            }
                          },
                          "bg": {
                            "color": {
                              "color": "error"
                            }
                          },
                          "radius": {
                            "radius": {
                              "topLeft": 2,
                              "topRight": 2,
                              "bottomLeft": 2,
                              "bottomRight": 2
                            }
                          }
                        },
                        "editorId": "ba96d839-4d48-4c5c-a04e-fb1d2be85164"
                      }
                    ],
                    "editorId": "c570f5c9-e21d-4691-9bc1-f6f831ad6956"
                  },
                  {
                    "type": "row",
                    "properties": {
                      "align": {
                        "align": {
                          "named": "space_between"
                        }
                      },
                      "cross_align": {
                        "align": {
                          "named": "center"
                        }
                      }
                    },
                    "children": [
                      {
                        "type": "column",
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
                        "children": [
                          {
                            "type": "iconbutton",
                            "properties": {
                              "name": {
                                "icon": {
                                  "name": "pause_circle_filled_rounded"
                                }
                              },
                              "size": {
                                "numberVal": {
                                  "value": 32
                                }
                              },
                              "color": {
                                "color": {
                                  "color": "primary_text"
                                }
                              }
                            },
                            "editorId": "86b57255-4f54-4ed5-b94f-d1d0ae80c580"
                          },
                          {
                            "type": "text",
                            "properties": {
                              "content": {
                                "stringVal": {
                                  "value": "Pause"
                                }
                              },
                              "style": {
                                "textStyle": {
                                  "styleName": "label_small"
                                }
                              },
                              "color": {
                                "color": {
                                  "color": "secondary_text"
                                }
                              }
                            },
                            "editorId": "245b543c-1851-477c-baef-12579b979091"
                          }
                        ],
                        "editorId": "faabc29e-f894-41bb-97ec-134b8e70db4b"
                      },
                      {
                        "type": "stack",
                        "properties": {
                          "align": {
                            "align": {
                              "named": "center"
                            }
                          }
                        },
                        "children": [
                          {
                            "type": "container",
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
                              "radius": {
                                "radius": {
                                  "topLeft": 0,
                                  "topRight": 0,
                                  "bottomLeft": 0,
                                  "bottomRight": 0,
                                  "token": "full"
                                }
                              },
                              "bg": {
                                "color": {
                                  "color": "#F472B622"
                                }
                              },
                              "blur": {
                                "numberVal": {
                                  "value": 8
                                }
                              }
                            },
                            "editorId": "e9a39b53-8073-483b-b240-2b1b48421626"
                          },
                          {
                            "type": "container",
                            "properties": {
                              "width": {
                                "px": {
                                  "value": 52,
                                  "isInfinity": false
                                }
                              },
                              "height": {
                                "px": {
                                  "value": 52,
                                  "isInfinity": false
                                }
                              },
                              "radius": {
                                "radius": {
                                  "topLeft": 0,
                                  "topRight": 0,
                                  "bottomLeft": 0,
                                  "bottomRight": 0,
                                  "token": "full"
                                }
                              },
                              "bg": {
                                "color": {
                                  "color": "error"
                                }
                              },
                              "align_child": {
                                "align": {
                                  "named": "center"
                                }
                              },
                              "shadow": {
                                "stringVal": {
                                  "value": "lg"
                                }
                              }
                            },
                            "children": [
                              {
                                "type": "icon",
                                "properties": {
                                  "name": {
                                    "icon": {
                                      "name": "stop_rounded"
                                    }
                                  },
                                  "color": {
                                    "color": {
                                      "color": "on_error"
                                    }
                                  },
                                  "size": {
                                    "numberVal": {
                                      "value": 28
                                    }
                                  }
                                },
                                "editorId": "97b3360d-08c1-446e-b0ad-27c68fadfff6"
                              }
                            ],
                            "editorId": "700bd8ce-6329-49a2-aebb-6f0ea51d355f"
                          }
                        ],
                        "editorId": "85e50818-5a6e-448c-be0e-0182e638c60b"
                      },
                      {
                        "type": "column",
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
                        "children": [
                          {
                            "type": "iconbutton",
                            "properties": {
                              "name": {
                                "icon": {
                                  "name": "upload_file_rounded"
                                }
                              },
                              "size": {
                                "numberVal": {
                                  "value": 32
                                }
                              },
                              "color": {
                                "color": {
                                  "color": "primary_text"
                                }
                              }
                            },
                            "editorId": "6c49ad03-a1d8-40a6-90cf-65c40d905273"
                          },
                          {
                            "type": "text",
                            "properties": {
                              "content": {
                                "stringVal": {
                                  "value": "Upload"
                                }
                              },
                              "style": {
                                "textStyle": {
                                  "styleName": "label_small"
                                }
                              },
                              "color": {
                                "color": {
                                  "color": "secondary_text"
                                }
                              }
                            },
                            "editorId": "e9f17015-6c14-4299-abfc-cf51cb804f49"
                          }
                        ],
                        "editorId": "783c405f-90d6-4eed-99e6-f88eb4a39eb7"
                      }
                    ],
                    "editorId": "8d7df34d-d24f-4bde-9b66-49b55f4c1abc"
                  }
                ],
                "editorId": "226cf7a4-718b-4d5b-9505-ade80ed20511"
              }
            ],
            "editorId": "fd96e8c1-6e36-4a16-8ddb-068f311f0205"
          }
        ],
        "editorId": "6ec3ac37-428d-402f-92dd-e4d9fa0eb55c"
      }
    ],
    "editorId": "c2c55591-4c23-4e6f-a859-da66c4e8ba7c"
  }
}
```