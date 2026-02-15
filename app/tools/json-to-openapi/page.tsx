"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { CopyTextarea } from "@/components/copy-textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode } from "lucide-react";
import yaml from "js-yaml";

type OutputFormat = "yaml" | "json";

export default function JsonToOpenApiPage() {
  const [input, setInput] = useState(`{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "country": "USA"
  },
  "hobbies": ["reading", "coding", "traveling"],
  "active": true
}`);
  const [apiTitle, setApiTitle] = useState("User API");
  const [apiVersion, setApiVersion] = useState("1.0.0");
  const [schemaName, setSchemaName] = useState("User");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("yaml");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const generateSchema = (obj: unknown, schemaName: string): Record<string, unknown> => {
    if (Array.isArray(obj)) {
      return {
        type: "array",
        items: obj.length > 0 ? generateSchema(obj[0], schemaName + "Item") : { type: "object" },
      };
    }

    if (typeof obj === "object" && obj !== null) {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(obj)) {
        properties[key] = generateSchema(value, key.charAt(0).toUpperCase() + key.slice(1));
        required.push(key);
      }
      
      return { 
        type: "object", 
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    if (typeof obj === "number") {
      return { 
        type: Number.isInteger(obj) ? "integer" : "number",
        example: obj,
      };
    }

    if (typeof obj === "boolean") {
      return { 
        type: "boolean",
        example: obj,
      };
    }

    if (typeof obj === "string") {
      // Detect email format
      if (obj.includes("@")) {
        return { 
          type: "string",
          format: "email",
          example: obj,
        };
      }
      return { 
        type: "string",
        example: obj,
      };
    }

    return { type: "string" };
  };

  const generateNestedSchemas = (obj: unknown, schemas: Record<string, unknown> = {}): Record<string, unknown> => {
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          const nestedName = key.charAt(0).toUpperCase() + key.slice(1);
          schemas[nestedName] = generateSchema(value, nestedName);
          generateNestedSchemas(value, schemas);
        }
      }
    }
    return schemas;
  };

  const generateOpenAPI = () => {
    setError("");
    try {
      const json = JSON.parse(input);
      const mainSchema = generateSchema(json, schemaName);
      const nestedSchemas = generateNestedSchemas(json);

      const openapi = {
        openapi: "3.0.0",
        info: {
          title: apiTitle,
          version: apiVersion,
          description: `API specification generated from JSON sample`,
        },
        servers: [
          {
            url: "https://api.example.com/v1",
            description: "Production server",
          },
        ],
        paths: {
          [`/${schemaName.toLowerCase()}s`]: {
            get: {
              summary: `List all ${schemaName}s`,
              operationId: `list${schemaName}s`,
              tags: [schemaName],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: {
                          $ref: `#/components/schemas/${schemaName}`,
                        },
                      },
                    },
                  },
                },
              },
            },
            post: {
              summary: `Create a new ${schemaName}`,
              operationId: `create${schemaName}`,
              tags: [schemaName],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      $ref: `#/components/schemas/${schemaName}`,
                    },
                  },
                },
              },
              responses: {
                "201": {
                  description: "Created",
                  content: {
                    "application/json": {
                      schema: {
                        $ref: `#/components/schemas/${schemaName}`,
                      },
                    },
                  },
                },
              },
            },
          },
          [`/${schemaName.toLowerCase()}s/{id}`]: {
            get: {
              summary: `Get a ${schemaName} by ID`,
              operationId: `get${schemaName}ById`,
              tags: [schemaName],
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: {
                    type: "string",
                  },
                },
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        $ref: `#/components/schemas/${schemaName}`,
                      },
                    },
                  },
                },
                "404": {
                  description: "Not found",
                },
              },
            },
            put: {
              summary: `Update a ${schemaName} (full replacement)`,
              operationId: `update${schemaName}`,
              tags: [schemaName],
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: {
                    type: "string",
                  },
                },
              ],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      $ref: `#/components/schemas/${schemaName}`,
                    },
                  },
                },
              },
              responses: {
                "200": {
                  description: "Updated successfully",
                  content: {
                    "application/json": {
                      schema: {
                        $ref: `#/components/schemas/${schemaName}`,
                      },
                    },
                  },
                },
                "404": {
                  description: "Not found",
                },
              },
            },
            patch: {
              summary: `Partially update a ${schemaName}`,
              operationId: `patch${schemaName}`,
              tags: [schemaName],
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: {
                    type: "string",
                  },
                },
              ],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      $ref: `#/components/schemas/${schemaName}`,
                    },
                  },
                },
              },
              responses: {
                "200": {
                  description: "Patched successfully",
                  content: {
                    "application/json": {
                      schema: {
                        $ref: `#/components/schemas/${schemaName}`,
                      },
                    },
                  },
                },
                "404": {
                  description: "Not found",
                },
              },
            },
            delete: {
              summary: `Delete a ${schemaName}`,
              operationId: `delete${schemaName}`,
              tags: [schemaName],
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: {
                    type: "string",
                  },
                },
              ],
              responses: {
                "204": {
                  description: "Deleted successfully",
                },
                "404": {
                  description: "Not found",
                },
              },
            },
          },
        },
        components: {
          schemas: {
            [schemaName]: mainSchema,
            ...nestedSchemas,
          },
        },
        tags: [
          {
            name: schemaName,
            description: `${schemaName} operations`,
          },
        ],
      };

      if (outputFormat === "yaml") {
        setOutput(yaml.dump(openapi, { lineWidth: 120, noRefs: true }));
      } else {
        setOutput(JSON.stringify(openapi, null, 2));
      }
    } catch (err) {
      setError("Invalid JSON: " + (err instanceof Error ? err.message : "Parse error"));
      setOutput("");
    }
  };

  return (
    <ToolLayout
      title="JSON to OpenAPI"
      description="Generate complete OpenAPI 3.0 specification from JSON with CRUD endpoints"
    >
      <div className="space-y-3">
        {/* Info Alert */}
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <FileCode className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs">
            <strong>Complete REST API:</strong> Generates a full OpenAPI 3.0 spec with all CRUD operations (GET, POST, PUT, PATCH, DELETE), nested schemas, and example values.
          </AlertDescription>
        </Alert>

        {/* Compact Configuration Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 p-3 bg-card border rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
            <div className="space-y-1.5">
              <Label htmlFor="apiTitle" className="text-xs text-muted-foreground">
                API Title
              </Label>
              <Input
                id="apiTitle"
                value={apiTitle}
                onChange={(e) => setApiTitle(e.target.value)}
                placeholder="My API"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apiVersion" className="text-xs text-muted-foreground">
                Version
              </Label>
              <Input
                id="apiVersion"
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
                placeholder="1.0.0"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schemaName" className="text-xs text-muted-foreground">
                Schema Name
              </Label>
              <Input
                id="schemaName"
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="User"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              Format:
            </Label>
            <Tabs value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="yaml" className="text-xs">YAML</TabsTrigger>
                <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Generate Button Row */}
        <div className="flex justify-end">
          <Button onClick={generateOpenAPI} size="sm">
            <FileCode className="h-4 w-4 mr-2" />
            Generate OpenAPI Spec
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Input/Output Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">JSON Sample</Label>
            <CopyTextarea
              value={input}
              onChange={setInput}
              placeholder="Enter JSON object..."
              rows={20}
              className="font-mono text-xs"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">OpenAPI 3.0 Specification</Label>
              {output && !error && (
                <Badge variant="secondary" className="text-xs">
                  {outputFormat.toUpperCase()}
                </Badge>
              )}
            </div>
            <CopyTextarea
              value={output}
              readOnly
              placeholder="Generated OpenAPI spec will appear here..."
              rows={20}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
