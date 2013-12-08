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

        export class Point {
            constructor(public row: number = 0, public col: number = 0) {}

            toString(): string {
                return this.row + 'x' + this.col;
            }

            isEqual(other: Point) {
                return (this.row == other.row && this.col == other.col);
            }
        }

        export class Rectangle {
            constructor(public top_left: Point,
                        public bottom_right: Point) {}

            intersect(other: Rectangle): Rectangle {
                var top_left = new Point(
                    Math.max(this.top_left.row, other.top_left.row),
                    Math.max(this.top_left.col, other.top_left.col));
                var bottom_right = new Point(
                    Math.min(this.bottom_right.row, other.bottom_right.row),
                    Math.min(this.bottom_right.col, other.bottom_right.col));
                return new Rectangle(top_left, bottom_right);
            }

            normalize(): void {
                if (this.top_left.row > this.bottom_right.row) {
                    var tmp = this.top_left.row;
                    this.top_left = new Point(this.bottom_right.row,
                                                    this.top_left.col);
                    this.bottom_right = new Point(tmp, this.bottom_right.col);
                }
                if (this.top_left.col > this.bottom_right.col) {
                    var tmp = this.top_left.col;
                    this.top_left = new Point(this.top_left.row,
                                                    this.bottom_right.col);
                    this.bottom_right = new Point(this.bottom_right.row, tmp);
                }
            }

            isNormalized(): boolean {
                return (this.top_left.row <= this.bottom_right.row) &&
                       (this.top_left.col <= this.bottom_right.col);
            }

            subtract(other: Rectangle): Array<Rectangle> {
                var rect_array: Array<Rectangle> = [];
                var top_rectangle = new Rectangle(
                    this.top_left,
                    new Point(other.top_left.row - 1, this.bottom_right.col));
                if (top_rectangle.isNormalized()) {
                    rect_array.push(top_rectangle);
                }
                var left_rectangle = new Rectangle(
                    new Point(other.top_left.row, this.top_left.col),
                    new Point(other.bottom_right.row, other.top_left.col - 1));
                if (left_rectangle.isNormalized()) {
                    rect_array.push(left_rectangle);
                }
                var right_rectangle = new Rectangle(
                    new Point(other.top_left.row, other.bottom_right.col + 1),
                    new Point(other.bottom_right.row, this.bottom_right.col));
                if (right_rectangle.isNormalized()) {
                    rect_array.push(right_rectangle);
                }
                var bottom_rectangle = new Rectangle(
                    new Point(other.bottom_right.row + 1, this.top_left.col),
                    this.bottom_right);
                if (bottom_rectangle.isNormalized()) {
                    rect_array.push(bottom_rectangle);
                }
                return rect_array;
            }

            toString(): string {
                return this.top_left + "/" + this.bottom_right;
            }
        }
    }
}
