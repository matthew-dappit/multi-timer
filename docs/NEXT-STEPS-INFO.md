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