// helper functions

export function decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
}


// mimics python's string.format(), supports '${} ${}...', '${0} ${1}...', '${a} ${b}...'
export function strFormat(str: string, ...args: any[]): string {
    return str.replace(/\${(\d+|[a-zA-Z_]\w*)}/g, (match, group) => {
        if (typeof group === 'number') { 
            return typeof args[group] !== 'undefined' ? args[group] : match;
        } else {
            return typeof args[0][group] !== 'undefined' ?  args[0][group] : match;
        }
    });
}