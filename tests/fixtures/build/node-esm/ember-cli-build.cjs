const mergeTrees = require('broccoli-merge-trees');
const concat = require('broccoli-concat');
const funnel = require('broccoli-funnel');

module.exports = function() {
    const txt = funnel('app', {
        include: ['*.txt'],
    });
    const md = funnel('app', {
        include: ['*.md'],
    });
    const concated = concat(txt, {
        outputFile: 'text.txt',
    });

    return mergeTrees([concated, md], {annotation: 'The final merge'});
}