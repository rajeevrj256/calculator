// Tiny local persistence server for the click/drag/resize canvas editor.
//
// Remotion Studio has no API for saving arbitrary element position/size —
// its save-props codemod only understands a composition's defaultProps
// object. So elements edited on the canvas persist through this instead:
// the browser POSTs the new rect here, we write it to layout.json, and
// Remotion's own dev-server file-watcher picks up the change and hot-reloads
// — same as any other source edit.
//
// Dev-only. Never imported into rendered output.
const http = require('http');
const fs = require('fs');
const path = require('path');

// Shared across every composition in the project — see src/editor/EditableCanvas.tsx.
const LAYOUT_PATH = path.join(__dirname, '..', 'src', 'editor', 'layout.json');
const PORT = 3999;

const readLayout = () => {
  try {
    return JSON.parse(fs.readFileSync(LAYOUT_PATH, 'utf8'));
  } catch {
    return {};
  }
};

const writeLayout = (layout) => {
  fs.writeFileSync(LAYOUT_PATH, JSON.stringify(layout, null, 2) + '\n');
};

const send = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/layout') {
    send(res, 200, readLayout());
    return;
  }

  if (req.method === 'POST' && req.url === '/layout') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const {id, rect} = JSON.parse(body);
        if (typeof id !== 'string') throw new Error('missing id');
        const layout = readLayout();
        if (rect === null) {
          // Explicit reset: forget the override, fall back to the
          // component's own design-time default rect.
          delete layout[id];
        } else if (rect === 'deleted') {
          layout[id] = 'deleted';
        } else {
          layout[id] = rect;
        }
        writeLayout(layout);
        send(res, 200, {ok: true});
      } catch (err) {
        send(res, 400, {ok: false, error: String(err)});
      }
    });
    return;
  }

  send(res, 404, {ok: false, error: 'not found'});
});

server.listen(PORT, () => {
  console.log(`Layout editor save-server listening on http://localhost:${PORT}`);
});
