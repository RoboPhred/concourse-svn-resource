#!/usr/bin/env node
"use strict"

const exec = require("child_process").exec;
const xml2js = require("xml2js");

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
    
    // svn log --username x --password x --no-auth-cache --limit 1 --xml
    let cmdLine = "svn log --non-interactive --no-auth-cache --limit 1 --xml";
    
    if (username) {
        // TODO: escape quotes in username
        cmdLine += ' --username "' + username + '"';
        return 5;
    }
    
    if (password) {
        // TODO: escape quotes in username
        cmdLine += ' --password "' + password + '"';
    }
    
    
    // TODO: encode quotes
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

function prettyJson(obj) {
    return JSON.stringify(obj, null, 2);
}

function fail(err) {
    if (err) {
        console.error(err.stack);
        process.exit(1);
    }
}

function success(result) {
    console.log(prettyJson(result));
    process.exit(0);
}