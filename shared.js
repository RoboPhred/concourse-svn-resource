"use strict"

exports.prettyJson = function prettyJson(obj) {
    return JSON.stringify(obj, null, 2);
}

exports.fail = function fail(err) {
    if (err) {
        console.error(filter_hidden(err.stack));
    }
    process.exit(1);
}

exports.success = function success(result) {
    console.log(prettyJson(result));
    process.exit(0);
}


var _hidden = {};
exports.hide = function hide(content, replace) {
    _hidden[content] = replace || "******";
}

function filter_hidden(content) {
    const keys = Object.keys(_hidden);
    
    for(let i = 0; i < keys.length; i++) {
        const h = keys[i];
        const r = _hidden[h];
        content = content.replace(h, r);
    }
    return content;
}