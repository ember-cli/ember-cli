import funnel from 'broccoli-funnel';

export default function() {
    return funnel('app', {
        include: ['*.txt'],
    });
}
