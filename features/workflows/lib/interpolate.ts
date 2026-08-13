type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function getByPath(obj: JsonValue, path: string): JsonValue | undefined {
  const parts = path.split(".");
  let current: JsonValue = obj;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    // Handle array index notation like items[0]
    const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      const key = arrayMatch[1];
      const index = Number(arrayMatch[2]);
      current = (current as Record<string, JsonValue>)[key];
      if (Array.isArray(current)) {
        current = current[index];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, JsonValue>)[part];
    }
  }

  return current;
}

export type { JsonValue };
export function interpolate(text: string, nodeOutputs: Record<string, JsonValue>): string {
  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, rawPath: string) => {
    // Important: trim the path. Tokens are written as "{{ nodeId.url }}" which
    // includes a trailing space before the closing braces. Without trimming, the
    // property becomes "url " and never matches the node output.
    const path = rawPath.trim();
    const [nodeId, ...propParts] = path.split(".");
    const propertyPath = propParts.join(".");
    const reference = `{{ ${path} }}`;

    const nodeOutput = nodeOutputs[nodeId];
    if (nodeOutput == null) {
      throw new Error(
        `Unresolved output reference ${reference}: node "${nodeId}" produced no output. ` +
          `Make sure node "${nodeId}" runs before this step and produces the referenced output.`
      );
    }

    const value = propertyPath ? getByPath(nodeOutput, propertyPath) : nodeOutput;

    if (value === undefined || value === null) {
      throw new Error(
        `Unresolved output reference ${reference}: the referenced output "${propertyPath}" ` +
          `from node "${nodeId}" is missing or empty.`
      );
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  });
}