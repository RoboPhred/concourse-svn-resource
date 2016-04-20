
const svn = require("node-svn");

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
    
    if (!repository) {
        fail(new Error("source.repository must be provided"));
    }
    
    const targetVersion = data.version;
    if (typeof targetVersion === "undefined") {
        fail(new Error("version must be provided"));
    }
    
    const svnVersion = toSvnVersion(targetVersion);
    svn.co(repository, svnVersion, destDir, (err, result) => {
        if (err) fail(err);
        // TODO: Get version from result
        // TODO: Get metadata.* from result
        success({
            version: targetVersion
        });
    });
});

function toSvnVersion(concourseVersion) {
    if (typeof concourseVersion.rev === "undefined" || concourseVersion.rev === null) {
        fail(new Error("invalid revision\n" + prettyJson(concourseVersion)));
    }
    return String(concourseVersion.rev);
}

function success(result) {
    prettyJson(result);
    process.exit(0);
}

function fail(err) {
    console.error(err.stack);
    process.exit(1);
}

function prettyJson(obj) {
    return JSON.stringify(obj, null, 2);
}

process.on("unhandledException", fail);