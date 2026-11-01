const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REMOTE = 'origin';
const BRANCH = 'main';

function git(args, timeout = 90000) {
    return execFileSync('git', args, {
        cwd: ROOT,
        encoding: 'utf8',
        timeout,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
    }).trim();
}

function npmInstall() {
    execFileSync('npm', ['install', '--no-audit', '--no-fund'], {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 180000,
        env: process.env
    });
}

function isSupervised() {
    return !!(process.env.pm_id || process.env.RAILWAY_ENVIRONMENT || process.env.RENDER_EXTERNAL_URL);
}

function scheduleRestart() {
    if (!isSupervised()) {
        const bootstrap = path.join(ROOT, 'bootstrap.js');
        const child = spawn('sh', [
            '-c',
            'sleep 2; exec "$1" "$2"',
            'zephyr-update',
            process.execPath,
            bootstrap
        ], {
            cwd: ROOT,
            detached: true,
            stdio: 'ignore',
            env: process.env
        });
        child.unref();
    }
    setTimeout(() => process.exit(0), 800);
}

function shortLog(text, max = 900) {
    const clean = String(text || '').replace(/\r/g, '').trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max) + '\n…';
}

async function updateCommand(sock, from, msg) {
    if (updateCommand._busy) {
        return sock.sendMessage(from, { text: 'Update already running.' }, { quoted: msg });
    }
    updateCommand._busy = true;
    let stashed = false;
    try {
        await sock.sendMessage(from, { text: 'Checking GitHub for updates…' }, { quoted: msg });

        if (!fs.existsSync(path.join(ROOT, '.git'))) {
            await sock.sendMessage(from, { text: 'This install is not a git repo, so .update cannot pull.' }, { quoted: msg });
            return;
        }

        const before = git(['rev-parse', 'HEAD']);
        const dirty = git(['status', '--porcelain']);
        if (dirty) {
            git(['stash', 'push', '-u', '-m', 'zephyr-update-stash']);
            stashed = true;
        }

        git(['fetch', REMOTE, BRANCH]);
        git(['pull', '--ff-only', REMOTE, BRANCH]);

        if (stashed) {
            try { git(['stash', 'pop']); } catch (e) {}
            stashed = false;
        }

        const after = git(['rev-parse', 'HEAD']);
        if (before === after) {
            await sock.sendMessage(from, { text: "You're using the latest version." }, { quoted: msg });
            return;
        }

        const summary = git(['log', '--oneline', `${before}..${after}`]);
        const pkgPath = path.join(ROOT, 'package.json');
        let needNpm = false;
        try {
            const beforePkg = git(['show', `${before}:package.json`]);
            const afterPkg = fs.readFileSync(pkgPath, 'utf8');
            needNpm = beforePkg !== afterPkg;
        } catch (e) {
            needNpm = true;
        }
        if (needNpm) {
            await sock.sendMessage(from, { text: 'package.json changed. Installing dependencies…' }, { quoted: msg });
            npmInstall();
        }

        await sock.sendMessage(from, {
            text: `Updated.\n${shortLog(summary)}\n\nRestarting to load new commands.`
        }, { quoted: msg });
        scheduleRestart();
    } catch (err) {
        if (stashed) {
            try { git(['stash', 'pop']); } catch (e) {}
        }
        const raw = err && (err.stderr || err.stdout || err.message) || 'Update failed.';
        await sock.sendMessage(from, { text: 'Update failed.\n' + shortLog(raw) }, { quoted: msg });
    } finally {
        updateCommand._busy = false;
    }
}

module.exports = updateCommand;
