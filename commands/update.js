const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REMOTE = 'origin';
const BRANCH = 'main';
const REPO_URL = 'https://github.com/Samkelo119/zephyrmdbot.git';

function readPkgVersion() {
    try {
        return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version || '';
    } catch (e) {
        return '';
    }
}

function git(args, timeout = 120000) {
    try {
        return execFileSync('git', args, {
            cwd: ROOT,
            encoding: 'utf8',
            timeout,
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: 'echo' }
        }).trim();
    } catch (err) {
        const parts = [err.stderr, err.stdout, err.message].filter(Boolean).map(String);
        const wrapped = new Error(parts.join('\n').trim() || 'git failed');
        wrapped.status = err.status;
        throw wrapped;
    }
}

let bootCommit = '';
try { bootCommit = git(['rev-parse', 'HEAD']); } catch (e) {}
const bootVersion = readPkgVersion();

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

function ensureOrigin() {
    try {
        const url = git(['remote', 'get-url', REMOTE]);
        if (!url) throw new Error('missing origin');
    } catch (e) {
        try { git(['remote', 'add', REMOTE, REPO_URL]); } catch (e2) {
            git(['remote', 'set-url', REMOTE, REPO_URL]);
        }
    }
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
            try {
                git(['stash', 'push', '-u', '-m', 'zephyr-update-stash']);
                stashed = true;
            } catch (e) {}
        }

        ensureOrigin();
        git(['fetch', '--prune', REMOTE, BRANCH]);

        let remoteHead = '';
        try { remoteHead = git(['rev-parse', `${REMOTE}/${BRANCH}`]); } catch (e) {}

        try {
            git(['pull', '--ff-only', REMOTE, BRANCH]);
        } catch (pullErr) {
            if (!remoteHead) throw pullErr;
            git(['checkout', '-B', BRANCH, `${REMOTE}/${BRANCH}`]);
            git(['reset', '--hard', `${REMOTE}/${BRANCH}`]);
        }

        if (stashed) {
            try { git(['stash', 'pop']); } catch (e) {}
            stashed = false;
        }

        const after = git(['rev-parse', 'HEAD']);
        const afterVersion = readPkgVersion();
        const label = afterVersion ? `V${afterVersion}` : 'latest';
        const alreadyOnDisk = before === after;
        const processIsCurrent = bootCommit && after === bootCommit;

        if (alreadyOnDisk && processIsCurrent) {
            await sock.sendMessage(from, { text: `You're using the latest version (${label}).` }, { quoted: msg });
            return;
        }

        let summary = '';
        try {
            if (!alreadyOnDisk) summary = git(['log', '--oneline', `${before}..${after}`]);
            else if (bootCommit && bootCommit !== after) {
                summary = git(['log', '--oneline', `${bootCommit}..${after}`]);
            }
        } catch (e) {}

        const pkgPath = path.join(ROOT, 'package.json');
        let needNpm = false;
        try {
            const cmp = bootCommit || before;
            const beforePkg = git(['show', `${cmp}:package.json`]);
            const afterPkg = fs.readFileSync(pkgPath, 'utf8');
            needNpm = beforePkg !== afterPkg;
        } catch (e) {
            needNpm = false;
        }
        if (needNpm) {
            await sock.sendMessage(from, { text: 'package.json changed. Installing dependencies…' }, { quoted: msg });
            try { npmInstall(); } catch (e) {}
        }

        await sock.sendMessage(from, {
            text: `Updated to ${label}.\n${shortLog(summary || 'Reloading running process.')}\n\nRestarting to load new commands.`
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
