module ascii_draw {
    export module utils {
        export function changeStyleRule(selector: string,
                                        style: string,
                                        value: string): void
        {
            var stylesheet = <CSSStyleSheet>document.styleSheets[0];
            var rules = stylesheet.cssRules || stylesheet.rules;

            var match: any = null;
            for (var i = 0; i != rules.length; i++) {
                if (rules[i].type === CSSRule.STYLE_RULE) {
                    var style_rule = <CSSStyleRule>rules[i];
                    if (style_rule.selectorText == selector) {
                        match = style_rule.style;
                        break;
                    }
                }
            }

            if (match === null) {
                if (stylesheet.insertRule) {
                    stylesheet.insertRule(
                            selector + ' {' + style + ':' + value + '}',
                            rules.length);
                } else {
                    stylesheet.addRule(selector, style + ':' + value);
                }
            } else {
                match[style] = value;
            }
        }

        export function computeFontSize(): { width: number; height: number; } {
            var tmp = document.createElement('table');
            var row = <HTMLTableRowElement>tmp.insertRow();
            var cell = row.insertCell();
            var div = document.createElement('div');
            div.textContent = 'X';
            cell.appendChild(div);
            document.body.appendChild(tmp);
            var w = cell.clientWidth;
            var h = cell.clientHeight;
            document.body.removeChild(tmp);
            return { width: w, height: h };
        }

        export function addClass(elem: HTMLElement,
                                 new_class: string): void
        {
            elem.className = elem.className + ' ' + new_class;
        }

        export function removeClass(elem: HTMLElement,
                                    old_class: string): void
        {
            var re = new RegExp('(?:^|\\s)' + old_class + '(?!\\S)', 'g');
            elem.className = elem.className.replace(re, '');
        }

        /* find the index of a given element in its parent */
        export function indexInParent(element: HTMLElement): number {
            var children = element.parentElement.children;
            for (var i = 0; i < children.length; i++) {
                if (children[i] == element) {
                    return i;
                }
            }
            return -1;
        }

        export function between(a: number, b: number, c: number): boolean {
            return (a <= b && b <= c) || (c <= b && b <= a);
        }
    }
}
