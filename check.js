#!/usr/bin/env node
"use strict"

const exec = require("child_process").exec;
const xml2js = require("xml2js");

const shared = require("./shared");

const success = shared.success;
const fail = shared.fail;
const hide = shared.hide;

process.stdin.on("data", stdin => {
    const data = JSON.parse(stdin);
    
    const source = data.source || {};
    const repository = source.repository || null;
    const username = source.username || null;
    const password = source.password || null;
    const trustCert = source["trust_server_cert"];

    if (!repository) {
        fail(new Error("source.repository must be provided"));
    }
    
    let revision = null;
    if (typeof data.version === 'object' && data.version != null) {
        const revisionType = typeof data.version.revision;
        if (revisionType === 'string' || revisionType === 'number') {
            revision = String(data.version.revision);
        }
    }
    
    let cmdLine = "svn log --non-interactive --no-auth-cache --xml";
    
    if (username) {
        // TODO: escape quotes in username
        cmdLine += ' --username "' + username + '"';
    }
    
    if (password) {
        // TODO: escape quotes in password
        const passwdCmd = '--password "' + password + '"'; 
        cmdLine += ' ' + passwdCmd;
        hide(passwdCmd, '--password "*****"');
    }
    
    if (trustCert) {
        cmdLine += ' --trust-server-cert';
    }

    if (revision) {
        // TODO: Check targetVersion format.  Escape quotes
        cmdLine += ' -r ' + revision + ':HEAD';
    }
    
    // TODO: encode
    cmdLine += ' "' + repository + '"';
    
    exec(cmdLine, (err, stdout, stderr) => {
        if (err) fail(err);
        const parser = new xml2js.Parser({
            explicitRoot: false
        });
        parser.parseString(stdout, (err, info) => {
            if (err) fail(err);
            
            const entries = info.logentry;
            const versions = entries.map(x => x['$']);

            success(versions);
        });
    });
});

