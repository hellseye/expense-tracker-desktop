import { app, type BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";

/**
 * End-to-end smoke test for the packaged launch path.
 *
 * Enabled with `LEDGER_SMOKE_TEST=1`. It loads the real renderer through the
 * custom protocol, records every console error, captures a screenshot, reads a
 * small amount of DOM state, and quits. This exercises the same code path the
 * installed application uses — no dev server, no Node server.
 *
 * Note: only trivial, single-expression `executeJavaScript` calls are used here.
 * Passing a large multi-line script that touches the contextBridge proxy makes
 * Chromium report a spurious `Unexpected token '!'` SyntaxError in this
 * Electron/Chromium combination, which would mask real failures.
 */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Runs a trivial expression in the renderer, tolerating failure. */
async function probe(
  contents: BrowserWindow["webContents"],
  expression: string,
): Promise<{ ok: boolean; value?: unknown; error?: string }> {
  try {
    const value = await contents.executeJavaScript(expression);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function runSmokeTest(window: BrowserWindow): void {
  const contents = window.webContents;
  const errors: string[] = [];
  let finished = false;

  contents.on("console-message", (_event, level, message, lineNumber, sourceId) => {
    // Electron levels: 0=verbose 1=info 2=warning 3=error
    if (level >= 2) {
      errors.push(`[level ${level}] ${message} (${sourceId}:${lineNumber})`);
    }
  });

  contents.on("did-fail-load", (_event, code, description) => {
    errors.push(`did-fail-load ${code} ${description}`);
  });

  const finish = (payload: unknown) => {
    if (finished) return;
    finished = true;

    const outDir = process.env.LEDGER_SMOKE_DIR || path.join(process.cwd(), "logs");
    fs.mkdirSync(outDir, { recursive: true });

    const resultPath = path.join(outDir, "smoke-result.json");
    fs.writeFileSync(resultPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(`SMOKE_RESULT_FILE ${resultPath}`);

    const screenshotPath = path.join(outDir, "smoke-screenshot.png");
    void contents
      .capturePage()
      .then((image) => {
        fs.writeFileSync(screenshotPath, image.toPNG());
        console.log(`SMOKE_SCREENSHOT ${screenshotPath}`);
      })
      .catch((error) => {
        console.log(`SMOKE_SCREENSHOT_FAILED ${String(error)}`);
      })
      .finally(() => {
        console.log(`SMOKE_ERRORS ${JSON.stringify(errors)}`);
        app.quit();
      });
  };

  contents.on("did-finish-load", () => {
    void (async () => {
      await sleep(2500);

      const title = await probe(contents, "document.title");
      const pathname = await probe(contents, "window.location.pathname");
      const bodyText = await probe(
        contents,
        "document.body ? document.body.innerText.replace(/\\s+/g,' ').trim().slice(0,200) : ''",
      );
      const bridgeType = await probe(contents, "typeof window.ledger");

      finish({
        title,
        pathname,
        bodyText,
        bridgeType,
        errors,
      });
    })().catch((error) => {
      finish({ errors: [...errors, `smoke test failed: ${String(error)}`] });
    });
  });

  // Safety net: never hang the test run.
  setTimeout(() => {
    finish({ errors: [...errors, "timed out waiting for did-finish-load"] });
  }, 30_000);
}
