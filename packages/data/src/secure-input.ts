interface SecretInput extends NodeJS.ReadableStream {
  isTTY?: boolean;
  setRawMode?: (mode: boolean) => void;
}

export function readSecretLine(
  input: SecretInput,
  output: NodeJS.WritableStream,
  prompt: string
): Promise<string> {
  output.write(prompt);
  const rawMode = input.isTTY === true && typeof input.setRawMode === "function";
  if (rawMode) input.setRawMode?.(true);
  input.resume();

  return new Promise((resolve, reject) => {
    let value = "";
    const finish = () => {
      input.removeListener("data", onData);
      if (rawMode) input.setRawMode?.(false);
      input.pause();
      output.write("\n");
    };
    const onData = (chunk: string | Buffer) => {
      for (const character of String(chunk)) {
        if (character === "\u0003") {
          finish();
          reject(new Error("Token input cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          resolve(value.trim());
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };
    input.on("data", onData);
  });
}
