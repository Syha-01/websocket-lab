// URL for public echo server (secure)
const WS_URL = "wss://echo.websocket.org";

// DOM refs
const statusEl = document.getElementById("status");
const openBtn = document.getElementById("openBtn");
const sendBtn = document.getElementById("sendBtn");
const closeBtn = document.getElementById("closeBtn");
const input = document.getElementById("messageInput");
const output = document.getElementById("output");

let socket = null;

/** UI helpers */
function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = cls;
}

function setButtons({ connected, connecting }) {
  // Send only when connected
  sendBtn.disabled = !connected;
  // Close only when connecting or connected? Typically only connected.
  closeBtn.disabled = !connected;

  // Open disabled while connected or connecting
  openBtn.disabled = connected || connecting;
}

/** Append a line to the output and autoscroll */
function logLine(line) {
  output.textContent += (output.textContent ? "\n" : "") + line;
  output.scrollTop = output.scrollHeight;
}

/** Open the WebSocket connection */
function openConnection() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return; // already open/connecting
  }

  setStatus("Status: Connecting…", "connecting");
  setButtons({ connected: false, connecting: true });

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    setStatus("Status: Connected ✅", "connected");
    setButtons({ connected: true, connecting: false });
    logLine("ℹ️  Connected to " + WS_URL);
    input.focus();
  };

  socket.onmessage = (e) => {
    logLine("Server: " + e.data);
  };

  socket.onerror = (e) => {
    // Browsers often give a generic error object; provide a helpful message
    logLine("⚠️  WebSocket error (see DevTools console for details)");
    console.debug("WebSocket error:", e);
  };

  socket.onclose = (evt) => {
    setStatus("Status: Disconnected ❌", "disconnected");
    setButtons({ connected: false, connecting: false });
    const code = evt.code;
    const reason = evt.reason || "no reason provided";
    logLine(`ℹ️  Connection closed (code ${code}) — ${reason}`);
  };
}

/** Send message if connected */
function sendMessage() {
  const msg = input.value.trim();
  if (!msg) return;
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    logLine("❌ Cannot send — socket is not open.");
    return;
  }
  socket.send(msg);
  logLine("You: " + msg);
  input.value = "";
  input.focus();
}

/** Close connection gracefully */
function closeConnection() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    socket.close(1000, "User requested close"); // Normal closure
  }
}

// Wire up UI
openBtn.addEventListener("click", openConnection);
sendBtn.addEventListener("click", sendMessage);
closeBtn.addEventListener("click", closeConnection);

// Send on Enter
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// Initial UI state
setStatus("Status: Disconnected ❌", "disconnected");
setButtons({ connected: false, connecting: false });
