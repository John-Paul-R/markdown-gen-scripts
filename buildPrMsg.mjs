'use strict';

import * as readline from 'readline';

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

var lines = [];
rl.on('line', (line) => {
    lines.push (line);
})


rl.on('close', () => {
    const DetailsRegex = /(?:\[(.+?)\])(?:(!\w+)(?:\.(\w+))?)?(?:{{\n?([\s\S]+?)?}})/gm;

    const inputString = lines.join('\n');
    const matches = inputString.matchAll(DetailsRegex);

    // startidx, endidx or match length, and ReplaceText 
    const toReplaceArr = [];

    for (const match of matches) {
        toReplaceArr.push({
            index: match.index,
            length: match[0].length,
            replaceText: buildDetailsText(matchToReplaceProps(match))
        });
    }

    console.log(toReplaceArr);

    let outFrags = [];
    let prevEndIdx = 0;

    for (const toReplace of toReplaceArr) {
        outFrags.push(inputString.substring(prevEndIdx, toReplace.index)
            + toReplace.replaceText
        );
        prevEndIdx = toReplace.index + toReplace.length;
        // the above can be optimized by not adding on the ending token.
    }

    outFrags.push(inputString.substring(prevEndIdx));


    process.stdout.write(outFrags.join(''));
})

/**
 * 
 * @param {string} summary 
 * @param {object} contentType 
 * @param {string} contentBody 
 * @returns string
 */
const buildDetailsText = ({summary, contentType, contentBody}) => {
    const contentTypeDetails = contentTypeProps[contentType.type];
    return `
<details>
<summary><code>${summary}</code></summary>
${contentTypeDetails.contentHeader?.(contentType.decoration) ?? ''}
${contentBody}
${contentTypeDetails.contentFooter?.(contentType.decoration) ?? ''}
</details>`
};

const outTemplate = `
<details>
<summary><code>$1</code></summary>

$2

</details>`;

const ContentType = {
    Text: 'Text',
    Code: 'Code',
}

const contentTypeProps = {
    [ContentType.Text]: {
        contentHeader: null,
        contentFooter: null,
    },
    [ContentType.Code]: {
        contentHeader: (decoration) => '```' + (decoration ? decoration : ''),
        contentFooter: () => '```',
    },
}

/**
 * 
 * @param {RegExpMatchArray} match 
 */
const matchToReplaceProps = (match) => ({
    summary: match[1],
    contentType: {
        type: !!match[2] && match[2] === '!code'
            ? ContentType.Code
            : ContentType.Text,
        decoration: match[3],
    },
    contentBody: match[4],
});