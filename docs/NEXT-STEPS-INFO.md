"/zoho_timers/resume": {
  "post": {
    "summary": "Resume a stopped timer with new interval",
    "description": "Resume a stopped timer with new interval\n\u003Cbr /\u003E\u003Cbr /\u003E\n\u003Cb\u003EAuthentication:\u003C/b\u003E required",
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
                "timer": {
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
              "timer_id": {
                "type": "integer",
                "format": "int64",
                "description": ""
              },
              "resume_time": {
                "type": "number",
                "format": "timestamptz",
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
              "timer_id": {
                "type": "integer",
                "format": "int64",
                "description": ""
              },
              "resume_time": {
                "type": "number",
                "format": "timestamptz",
                "description": "",
                "nullable": true
              }
            }
          }
        }
      }
    }
  }
},
"/zoho_timers/start": {
  "post": {
    "summary": "Start a timer and create first interval",
    "description": "Start a timer and create first interval\n\u003Cbr /\u003E\u003Cbr /\u003E\n\u003Cb\u003EAuthentication:\u003C/b\u003E required",
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
                "timer": {
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
              "user_id": {
                "type": "integer",
                "format": "int64",
                "description": ""
              },
              "zoho_project_id": {
                "type": "string",
                "description": ""
              },
              "zoho_task_id": {
                "type": "string",
                "description": ""
              },
              "notes": {
                "type": "string",
                "description": ""
              },
              "start_time": {
                "type": "number",
                "format": "timestamptz",
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
              "user_id": {
                "type": "integer",
                "format": "int64",
                "description": ""
              },
              "zoho_project_id": {
                "type": "string",
                "description": ""
              },
              "zoho_task_id": {
                "type": "string",
                "description": ""
              },
              "notes": {
                "type": "string",
                "description": ""
              },
              "start_time": {
                "type": "number",
                "format": "timestamptz",
                "description": "",
                "nullable": true
              }
            }
          }
        }
      }
    }
  }
},
"/zoho_timers/stop": {
  "post": {
    "summary": "Stop running timer and close current interval",
    "description": "Stop running timer and close current interval\n\u003Cbr /\u003E\u003Cbr /\u003E\n\u003Cb\u003EAuthentication:\u003C/b\u003E required",
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
                "timer": {
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
              "timer_id": {
                "type": "integer",
                "format": "int64",
                "description": ""
              },
              "end_time": {
                "type": "number",
                "format": "timestamptz",
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
              "timer_id": {
                "type": "integer",
                "format": "int64",
                "description": ""
              },
              "end_time": {
                "type": "number",
                "format": "timestamptz",
                "description": "",
                "nullable": true
              }
            }
          }
        }
      }
    }
  }
},