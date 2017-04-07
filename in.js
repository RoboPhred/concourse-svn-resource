#!/usr/bin/env node
"use strict"

const exec = require("child_process").exec;
const xml2js = require("xml2js");

const shared = require("./shared");

const success = shared.success;
const fail = shared.fail;
const hide = shared.hide;

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
    
    let cmdLine = "svn checkout --non-interactive --no-auth-cache";
    
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
        cmdLine += ' -r "' + revision + '"';
    }
    
    // TODO: urlencode
    cmdLine += ' "' + repository + '" .';
    exec(cmdLine, {cwd: destDir, maxBuffer: 8192*1024}, (err, stdout, stderr) => {
        // TODO: We can generate an incredible amount of output for large repos.
        //  Stream this and check each line as it passes.
        if (stderr && stderr !== "") {
            fail(new Error(stderr), cmdLine);
        }

        if(err) {
            fail(err, cmdLine);
        }
        
        const lines = stdout.split('\n');
        if (lines.length <= 1) {
            fail(new Error("no output from svn checkout"), cmdLine);
        }
        
        // "Checked out revision 47830."
        // TODO: Regex me this, batman
        // Might want to just svn status on the new dir, since that will get us metadata as well.
        const revLine = lines[lines.length - 2];
        const header = "Checked out revision ";
        if (revLine.substr(0, header.length) !== header) {
            fail(new Error('unexpected svn output.  expected revision, got "' + lines.slice(lines.length - 5).join("\n") + '"'), cmdLine);
        }
        
        const rev = revLine.substr(header.length, revLine.length - header.length - 2);
        success({
            "version": {
                "revision": rev
            },
            // TODO: Metadata.  We may want to do an svn info to get this. 
            // metadata: {
            //     author: entry["author"][0],
            //     date: entry["date"][0],
            //     msg: entry["msg"][0]
            // }
        });
    });
});
