import funnel = require('broccoli-funnel');

export = function() {
    return funnel('app', {
        include: ['*.txt'],
    });
}
