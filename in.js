#!/usr/bin/env node
"use strict"

const exec = require("child_process").exec;
const xml2js = require("xml2js");

//node in.js /path
if (process.argv.length < 3) {
    fail(new Error("destination directory must be specified"));
}

// TODO: Must path exist?  Should we try to create it?
const destDir = process.argv[2];
if (destDir === "") {
    fail(new Error("destination directory must be specified"));
}

process.stdin.on("data", stdin => {
    const data = JSON.parse(stdin);
    
    const source = data.source || {};
    const repository = source.repository || null;
    const username = source.username || null;
    const password = source.password || null;
    
    if (!repository) {
        fail(new Error("source.repository must be provided"));
    }
    
    const targetVersion = data.version;
    // if (typeof targetVersion === "undefined") {
    //     fail(new Error("version must be provided"));
    // }
    
    // svn checkout --username x --password x --no-auth-cache --xml
    let cmdLine = "svn checkout --non-interactive --no-auth-cache";
    
    if (username) {
        // TODO: make cmd line safe
        cmdLine += ' --username "' + username + '"';
    }
    
    if (password) {
        // TODO: make cmd line safe
        cmdLine += ' --password "' + password + '"';
    }
    
    if (targetVersion) {
        cmdLine += ' -r "' + targetVersion.revision + '"';
    }
    
    // TODO: urlencode
    cmdLine += ' "' + repository + '"';
    exec(cmdLine, {cwd: destDir}, (err, stdout, stderr) => {
        // TODO: We can generate an incredible amount of output for large repos.
        //  Stream this and check each line as it passes.
        if (stderr && stderr !== "") {
            fail(new Error(stderr));
        }
        
        const lines = stdout.split('\n');
        if (lines.length <= 1) {
            fail(new Error("no output from svn checkout"));
        }
        
        // "Checked out revision 47830."
        // TODO: Regex me this, batman
        // Might want to just svn status on the new dir, since that will get us metadata as well.
        const revLine = lines[lines.length - 2];
        const header = "Checked out revision ";
        if (revLine.substr(0, header.length) !== header) {
            fail(new Error('unexpected svn output.  expected revision, got "' + lines.slice(lines.length - 5).join("\n") + '"'));
        }
        
        const rev = revLine.substr(header.length, revLine.length - header.length - 1);
        success({
            "version": {
                "revision": rev
            }
        });
    });
});

function success(result) {
    console.log(prettyJson(result));
    process.exit(0);
}

function fail(err) {
    console.error(err.stack);
    process.exit(1);
}

function prettyJson(obj) {
    return JSON.stringify(obj, null, 2);
}
