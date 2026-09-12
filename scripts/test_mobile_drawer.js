import { spawn } from 'child_process';
import http from 'http';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9222;

const chrome = spawn(chromePath, [
  '--headless',
  '--disable-gpu',
  `--remote-debugging-port=${port}`,
  '--window-size=390,844',
  'about:blank'
]);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const data = await res.json();
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
    } catch (e) {
      await wait(200);
    }
  }
  throw new Error('Chrome remote debugging did not respond');
}

async function run() {
  try {
    const wsUrl = await getWsUrl();
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve) => ws.onopen = resolve);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    // Create a new target/page
    const { targetId } = await send('Target.createTarget', { url: 'http://localhost:4173/' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

    function sendSession(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
      });
    }

    await sendSession('Page.enable');
    await sendSession('Runtime.enable');
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });

    await wait(1500);

    // Click the hamburger toggle button
    console.log('Clicking hamburger...');
    await sendSession('Runtime.evaluate', {
      expression: `
        const btn = document.querySelector('.main-header-menu-toggle');
        if (btn) btn.click();
      `
    });

    await wait(600);

    // Click the language switcher dropdown toggle in the mobile menu
    console.log('Clicking mobile language switcher...');
    const clickRes = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('.ast-mobile-popup-content .pll-parent-menu-item .ast-menu-toggle');
          const a = document.querySelector('.ast-mobile-popup-content .pll-parent-menu-item a');
          const target = btn || a;
          if (!target) return 'NOT_FOUND';
          target.click();
          return target.outerHTML.substring(0, 100);
        })()
      `
    });
    console.log('Click result:', clickRes.result.value);

    await wait(600);

    // Click Deutsch
    console.log('Clicking Deutsch link...');
    await sendSession('Runtime.evaluate', {
      expression: `
        const deLink = document.querySelector('#menu-item-2832-de a');
        if (deLink) deLink.click();
      `
    });

    await wait(800);

    // Capture screenshot of German page
    const { data } = await sendSession('Page.captureScreenshot', { format: 'png' });
    const fs = await import('fs');
    fs.writeFileSync('verification/recreation_mobile_navigated_de.png', Buffer.from(data, 'base64'));
    console.log('Captured verification/recreation_mobile_navigated_de.png');

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

run();
