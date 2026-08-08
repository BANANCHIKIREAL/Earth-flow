export default function handler(req, res) {
  res.statusCode = 503;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Retry-After", "900");

  res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Service unavailable</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: 100%;
      min-height: 100%;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;

      background: #fafafa;
      color: #111827;

      font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;
    }

    .container {
      width: 100%;
      max-width: 520px;
      text-align: center;
    }

    .icon {
      width: 56px;
      height: 56px;

      margin: 0 auto 24px;

      display: flex;
      align-items: center;
      justify-content: center;

      border: 1px solid #d1d5db;
      border-radius: 50%;

      background: #ffffff;

      font-size: 22px;
      font-weight: 600;
    }

    .code {
      margin: 0;

      color: #6b7280;

      font-size: 12px;
      font-weight: 600;

      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    h1 {
      margin: 12px 0 0;

      font-size: 36px;
      line-height: 1.15;
      letter-spacing: -0.03em;

      font-weight: 650;
    }

    .description {
      max-width: 430px;

      margin: 16px auto 0;

      color: #6b7280;

      font-size: 15px;
      line-height: 1.65;
    }

    .timer-box {
      margin: 26px auto 0;
      padding: 16px 20px;

      max-width: 260px;

      border: 1px solid #e5e7eb;
      border-radius: 10px;

      background: #ffffff;
    }

    .timer-label {
      margin: 0 0 6px;

      color: #9ca3af;

      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    #timer {
      margin: 0;

      font-size: 30px;
      font-weight: 650;

      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
    }

    button {
      margin-top: 26px;

      padding: 10px 18px;

      border: 1px solid #d1d5db;
      border-radius: 7px;

      background: #ffffff;
      color: #111827;

      font: inherit;
      font-size: 14px;
      font-weight: 500;

      cursor: pointer;

      transition:
        background 0.15s ease,
        border-color 0.15s ease;
    }

    button:hover {
      background: #f3f4f6;
      border-color: #c7cbd1;
    }

    button:active {
      background: #e5e7eb;
    }

    .footer {
      margin-top: 30px;

      color: #9ca3af;

      font-size: 12px;
    }

    @media (max-width: 520px) {
      h1 {
        font-size: 30px;
      }

      .description {
        font-size: 14px;
      }
    }
  </style>
</head>

<body>
  <main class="container">

    <div class="icon">!</div>

    <p class="code">
      Error 503
    </p>

    <h1>
      Service temporarily unavailable
    </h1>

    <p class="description">
      Earth Flow is currently unable to process this request.
      Please try again later.
    </p>

    <div class="timer-box">
      <p class="timer-label">
        Service unavailable for
      </p>

      <p id="timer">
        15:00
      </p>
    </div>

    <button onclick="window.location.reload()">
      Try again
    </button>

    <p class="footer">
      Request failed · Service unavailable
    </p>

  </main>

  <script>
    const STORAGE_KEY = "earthflow_maintenance_started";

    let startTime = Number(localStorage.getItem(STORAGE_KEY));

    if (!startTime) {
      startTime = Date.now();
      localStorage.setItem(STORAGE_KEY, String(startTime));
    }

    const timer = document.getElementById("timer");

    const START_OFFSET_SECONDS = 15 * 60;

    function updateTimer() {
      const elapsedMilliseconds = Date.now() - startTime;
      const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

      const totalSeconds = START_OFFSET_SECONDS + elapsedSeconds;

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours > 0) {
        timer.textContent =
          String(hours).padStart(2, "0") +
          ":" +
          String(minutes).padStart(2, "0") +
          ":" +
          String(seconds).padStart(2, "0");
      } else {
        timer.textContent =
          String(minutes).padStart(2, "0") +
          ":" +
          String(seconds).padStart(2, "0");
      }
    }

    updateTimer();

    setInterval(updateTimer, 1000);
  </script>

</body>
</html>`);
}
