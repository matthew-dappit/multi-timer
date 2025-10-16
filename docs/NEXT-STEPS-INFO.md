## Database schemas
zoho_timers schema:

interface YourInterfaceName {
  id: number;
  dappit_user_id: number;
  zoho_project_id: string;
  zoho_task_id: string;
  notes: string;
  active_date: string;
  total_duration: number;
  status: "idle" | "running" | "stopped";
  synced_to_zoho: boolean;
  zoho_time_entry_id: string;
  created_at: number;
  updated_at: number;
}

zoho_timer_intervals schema:
interface YourInterfaceName {
  id: number;
  created_at: number;
  zoho_timer_id: number;
  start_time: number;
  end_time: number;
  duration: number;
}

## API swagger docs

"/zoho_timers": {
      "get": {
        "summary": "Get all user's timers ",
        "description": "Get all user's timers \n\u003Cbr /\u003E\u003Cbr /\u003E\n\u003Cb\u003EAuthentication:\u003C/b\u003E required",
        "tags": [
          "zoho_timers"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "user_id",
            "in": "query",
            "description": "",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int64",
              "default": "0"
            }
          },
          {
            "name": "active_date",
            "in": "query",
            "description": "",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date",
              "default": "today"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success!",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "all_timers": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "integer",
                            "format": "int64",
                            "description": ""
                          },
                          "dappit_user_id": {
                            "type": "integer",
                            "format": "int64",
                            "description": "Table reference to your dappit_users table."
                          },
                          "zoho_project_id": {
                            "type": "string",
                            "description": "Zoho's external ID for the project."
                          },
                          "zoho_task_id": {
                            "type": "string",
                            "description": "Zoho's external ID for the task."
                          },
                          "notes": {
                            "type": "string",
                            "description": "Optional notes for the time log."
                          },
                          "active_date": {
                            "type": "string",
                            "format": "date",
                            "description": "",
                            "nullable": true,
                            "default": "today"
                          },
                          "total_duration": {
                            "type": "integer",
                            "format": "int64",
                            "description": "Calculated total duration of the timer in seconds."
                          },
                          "status": {
                            "type": "string",
                            "description": "Current status of the timer.",
                            "enum": [
                              "idle",
                              "running",
                              "stopped"
                            ],
                            "default": "running"
                          },
                          "synced_to_zoho": {
                            "type": "boolean",
                            "description": "Indicates if the timer entry has been synced to Zoho.",
                            "default": "false"
                          },
                          "zoho_time_entry_id": {
                            "type": "string",
                            "description": "The unique ID from Zoho's API for the time entry, if synced."
                          },
                          "created_at": {
                            "type": "number",
                            "format": "timestamptz",
                            "description": "",
                            "default": "now"
                          },
                          "updated_at": {
                            "type": "number",
                            "format": "timestamptz",
                            "description": "Timestamp of the last update to this record."
                          },
                          "zoho_intervals_for_timer": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "id": {
                                  "type": "integer",
                                  "format": "int64",
                                  "description": ""
                                },
                                "start_time": {
                                  "type": "number",
                                  "format": "timestamptz",
                                  "description": "The start time of the interval."
                                },
                                "end_time": {
                                  "type": "number",
                                  "format": "timestamptz",
                                  "description": "The end time of the interval (optional, if still running).",
                                  "nullable": true
                                },
                                "duration": {
                                  "type": "integer",
                                  "format": "int64",
                                  "description": "The duration of the interval in seconds (optional)."
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Input Error. Check the request payload for issues."
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Access denied. Additional privileges are needed access the requested resource."
          },
          "404": {
            "description": "Not Found. The requested resource does not exist."
          },
          "429": {
            "description": "Rate Limited. Too many requests."
          },
          "500": {
            "description": "Unexpected error"
          }
        }
      },
      "post": {
        "summary": "Create a timer without starting a time_interval. This is used when adding a time interval to a timer that hasn't been initialised. ",
        "description": "Create a timer without starting a time_interval. This is used when adding a time interval to a timer that hasn't been initialised. \n\u003Cbr /\u003E\u003Cbr /\u003E\n\u003Cb\u003EAuthentication:\u003C/b\u003E required",
        "tags": [
          "zoho_timers"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [],
        "responses": {
          "200": {
            "description": "Success!",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "integer",
                      "format": "int64",
                      "description": ""
                    },
                    "zoho_project_id": {
                      "type": "string",
                      "description": "Zoho's external ID for the project."
                    },
                    "zoho_task_id": {
                      "type": "string",
                      "description": "Zoho's external ID for the task."
                    },
                    "notes": {
                      "type": "string",
                      "description": "Optional notes for the time log."
                    },
                    "active_date": {
                      "type": "string",
                      "format": "date",
                      "description": "",
                      "nullable": true,
                      "default": "today"
                    },
                    "total_duration": {
                      "type": "integer",
                      "format": "int64",
                      "description": "Calculated total duration of the timer in seconds."
                    },
                    "status": {
                      "type": "string",
                      "description": "Current status of the timer.",
                      "enum": [
                        "idle",
                        "running",
                        "stopped"
                      ],
                      "default": "running"
                    },
                    "synced_to_zoho": {
                      "type": "boolean",
                      "description": "Indicates if the timer entry has been synced to Zoho.",
                      "default": "false"
                    },
                    "zoho_time_entry_id": {
                      "type": "string",
                      "description": "The unique ID from Zoho's API for the time entry, if synced."
                    },
                    "time_intervals_for_timer": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "integer",
                            "format": "int64",
                            "description": ""
                          },
                          "start_time": {
                            "type": "number",
                            "format": "timestamptz",
                            "description": "The start time of the interval."
                          },
                          "end_time": {
                            "type": "number",
                            "format": "timestamptz",
                            "description": "The end time of the interval (optional, if still running).",
                            "nullable": true
                          },
                          "duration": {
                            "type": "integer",
                            "format": "int64",
                            "description": "The duration of the interval in seconds (optional)."
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Input Error. Check the request payload for issues."
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Access denied. Additional privileges are needed access the requested resource."
          },
          "404": {
            "description": "Not Found. The requested resource does not exist."
          },
          "429": {
            "description": "Rate Limited. Too many requests."
          },
          "500": {
            "description": "Unexpected error"
          }
        },
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "dappit_user_id": {
                    "type": "integer",
                    "format": "int64",
                    "description": "Table reference to your dappit_users table."
                  },
                  "zoho_project_id": {
                    "type": "string",
                    "description": "Zoho's external ID for the project."
                  },
                  "zoho_task_id": {
                    "type": "string",
                    "description": "Zoho's external ID for the task."
                  },
                  "notes": {
                    "type": "string",
                    "description": "Optional notes for the time log."
                  },
                  "active_date": {
                    "type": "string",
                    "format": "date",
                    "description": "",
                    "nullable": true
                  }
                }
              }
            },
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "dappit_user_id": {
                    "type": "integer",
                    "format": "int64",
                    "description": "Table reference to your dappit_users table."
                  },
                  "zoho_project_id": {
                    "type": "string",
                    "description": "Zoho's external ID for the project."
                  },
                  "zoho_task_id": {
                    "type": "string",
                    "description": "Zoho's external ID for the task."
                  },
                  "notes": {
                    "type": "string",
                    "description": "Optional notes for the time log."
                  },
                  "active_date": {
                    "type": "string",
                    "format": "date",
                    "description": "",
                    "nullable": true
                  }
                }
              }
            }
          }
        }
      }
    }

"/zoho_timer_intervals/{id}": {
      "delete": {
        "summary": "Delete's a time interval and edits the duration on the timer",
        "description": "Delete's a time interval and edits the duration on the timer\n\u003Cbr /\u003E\u003Cbr /\u003E\n\u003Cb\u003EAuthentication:\u003C/b\u003E required",
        "tags": [
          "zoho_timer_intervals"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success!",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "integer",
                      "format": "int64",
                      "description": ""
                    },
                    "created_at": {
                      "type": "number",
                      "format": "timestamptz",
                      "description": "",
                      "default": "now"
                    },
                    "zoho_timer_id": {
                      "type": "integer",
                      "format": "int64",
                      "description": ""
                    },
                    "start_time": {
                      "type": "number",
                      "format": "timestamptz",
                      "description": "The start time of the interval."
                    },
                    "end_time": {
                      "type": "number",
                      "format": "timestamptz",
                      "description": "The end time of the interval (optional, if still running).",
                      "nullable": true
                    },
                    "duration": {
                      "type": "integer",
                      "format": "int64",
                      "description": "The duration of the interval in seconds (optional)."
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Input Error. Check the request payload for issues."
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Access denied. Additional privileges are needed access the requested resource."
          },
          "404": {
            "description": "Not Found. The requested resource does not exist."
          },
          "429": {
            "description": "Rate Limited. Too many requests."
          },
          "500": {
            "description": "Unexpected error"
          }
        }
      }
    },

"/zoho_timer_intervals": {
      "get": {
        "summary": "Get intervals for analytics/heatmap (optional: date range)",
        "description": "Get intervals for analytics/heatmap (optional: date range)\n\u003Cbr /\u003E\u003Cbr /\u003E\n\u003Cb\u003EAuthentication:\u003C/b\u003E required",
        "tags": [
          "zoho_timer_intervals"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "user_id",
            "in": "query",
            "description": "",
            "required": false,
            "schema": {
              "type": "integer",
              "format": "int64",
              "default": "0"
            }
          },
          {
            "name": "start_date",
            "in": "query",
            "description": "",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date",
              "default": "today"
            }
          },
          {
            "name": "end_date",
            "in": "query",
            "description": "",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date",
              "default": "today"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success!",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {

                  }
                }
              }
            }
          },
          "400": {
            "description": "Input Error. Check the request payload for issues."
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Access denied. Additional privileges are needed access the requested resource."
          },
          "404": {
            "description": "Not Found. The requested resource does not exist."
          },
          "429": {
            "description": "Rate Limited. Too many requests."
          },
          "500": {
            "description": "Unexpected error"
          }
        }
      },
      "post": {
        "summary": "Add a new completed time interval that the user has manually added on the frontend.",
        "description": "Add a new completed time interval that the user has manually added on the frontend.\n\u003Cbr /\u003E\u003Cbr /\u003E\n\u003Cb\u003EAuthentication:\u003C/b\u003E required",
        "tags": [
          "zoho_timer_intervals"
        ],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [],
        "responses": {
          "200": {
            "description": "Success!",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "integer",
                      "format": "int64",
                      "description": ""
                    },
                    "zoho_project_id": {
                      "type": "string",
                      "description": "Zoho's external ID for the project."
                    },
                    "zoho_task_id": {
                      "type": "string",
                      "description": "Zoho's external ID for the task."
                    },
                    "notes": {
                      "type": "string",
                      "description": "Optional notes for the time log."
                    },
                    "active_date": {
                      "type": "string",
                      "format": "date",
                      "description": "",
                      "nullable": true,
                      "default": "today"
                    },
                    "total_duration": {
                      "type": "integer",
                      "format": "int64",
                      "description": "Calculated total duration of the timer in seconds."
                    },
                    "status": {
                      "type": "string",
                      "description": "Current status of the timer.",
                      "enum": [
                        "idle",
                        "running",
                        "stopped"
                      ],
                      "default": "running"
                    },
                    "synced_to_zoho": {
                      "type": "boolean",
                      "description": "Indicates if the timer entry has been synced to Zoho.",
                      "default": "false"
                    },
                    "zoho_time_entry_id": {
                      "type": "string",
                      "description": "The unique ID from Zoho's API for the time entry, if synced."
                    },
                    "time_intervals_for_timer": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "integer",
                            "format": "int64",
                            "description": ""
                          },
                          "start_time": {
                            "type": "number",
                            "format": "timestamptz",
                            "description": "The start time of the interval."
                          },
                          "end_time": {
                            "type": "number",
                            "format": "timestamptz",
                            "description": "The end time of the interval (optional, if still running).",
                            "nullable": true
                          },
                          "duration": {
                            "type": "integer",
                            "format": "int64",
                            "description": "The duration of the interval in seconds (optional)."
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Input Error. Check the request payload for issues."
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Access denied. Additional privileges are needed access the requested resource."
          },
          "404": {
            "description": "Not Found. The requested resource does not exist."
          },
          "429": {
            "description": "Rate Limited. Too many requests."
          },
          "500": {
            "description": "Unexpected error"
          }
        },
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "zoho_timer_id": {
                    "type": "integer",
                    "format": "int64",
                    "description": ""
                  },
                  "start_time": {
                    "type": "number",
                    "format": "timestamptz",
                    "description": "The start time of the interval."
                  },
                  "end_time": {
                    "type": "number",
                    "format": "timestamptz",
                    "description": "The end time of the interval (optional, if still running).",
                    "nullable": true
                  },
                  "duration": {
                    "type": "integer",
                    "format": "int64",
                    "description": "",
                    "default": "Duration in seconds rounded to the nearest second."
                  }
                }
              }
            },
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "properties": {
                  "zoho_timer_id": {
                    "type": "integer",
                    "format": "int64",
                    "description": ""
                  },
                  "start_time": {
                    "type": "number",
                    "format": "timestamptz",
                    "description": "The start time of the interval."
                  },
                  "end_time": {
                    "type": "number",
                    "format": "timestamptz",
                    "description": "The end time of the interval (optional, if still running).",
                    "nullable": true
                  },
                  "duration": {
                    "type": "integer",
                    "format": "int64",
                    "description": "",
                    "default": "Duration in seconds rounded to the nearest second."
                  }
                }
              }
            }
          }
        }
      }
    }