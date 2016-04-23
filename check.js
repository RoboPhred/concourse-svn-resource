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

    if (!repository) {
        fail(new Error("source.repository must be provided"));
    }
    
    const targetVersion = data.version || null;
    
    let cmdLine = "svn log --non-interactive --no-auth-cache --limit 1 --xml";
    
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
            if (!entries || !entries[0]) {
                success([]);
            }
            
            const entry = entries[0];
            success({
                version: entry["$"], // {"revision": "1234"}
                metadata: {
                    author: entry["author"][0],
                    date: entry["date"][0],
                    msg: entry["msg"][0]
                }
            });
        });
    });
});

