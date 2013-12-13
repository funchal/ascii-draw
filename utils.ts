'use strict';

module utils {
    export function changeStyleRule(selector: string,
                                    style: string,
                                    value: string): void
    {
        var stylesheet = <CSSStyleSheet>document.styleSheets[0];
        var rules = stylesheet.cssRules || stylesheet.rules;
        var match: any = null;

        if (rules !== null) {
            for (var i = 0; i != rules.length; i++) {
                if (rules[i].type === CSSRule.STYLE_RULE) {
                    var style_rule = <CSSStyleRule>rules[i];
                    if (style_rule.selectorText == selector) {
                        match = style_rule.style;
                        break;
                    }
                }
            }
        }

        if (match === null) {
            if (stylesheet.insertRule && rules !== null) {
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

    export function stacktrace() {
        console.log((<any>new Error()).stack);
    }

    export function computeFontSize(): { width: number; height: number; } {
        var tmp = document.createElement('table');
        var row = <HTMLTableRowElement>tmp.insertRow();
        var cell = row.insertCell();
        cell.textContent = 'X';
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

        isEqual(other: Point): boolean {
            return (this.row == other.row && this.col == other.col);
        }
    }

    export class Rectangle {
        constructor(public top_left: Point,
                    public bottom_right: Point, normalize?: boolean) {
            if (normalize) {
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
        }

        intersect(other: Rectangle): Rectangle {
            var top_left = new Point(
                Math.max(this.top_left.row, other.top_left.row),
                Math.max(this.top_left.col, other.top_left.col));
            var bottom_right = new Point(
                Math.min(this.bottom_right.row, other.bottom_right.row),
                Math.min(this.bottom_right.col, other.bottom_right.col));
            return new Rectangle(top_left, bottom_right);
        }

        getHeight(): number {
            // Warning: can be < 0 if this.isEmpty()
            return this.bottom_right.row - this.top_left.row + 1;
        }

        getWidth(): number {
            // Warning: can be < 0 if this.isEmpty()
            return this.bottom_right.col - this.top_left.col + 1;
        }

        isUnit(): boolean {
            return (this.top_left.row === this.bottom_right.row) &&
                   (this.top_left.col === this.bottom_right.col);
        }

        isEmpty(): boolean {
            return (this.top_left.row > this.bottom_right.row) ||
                   (this.top_left.col > this.bottom_right.col);
        }

        isEqual(other: Rectangle): boolean {
            return (this.top_left.isEqual(other.top_left) &&
                    this.bottom_right.isEqual(other.bottom_right));
        }

        /* Return the difference of this with other as a list of Rectangles.
        Examples:
        this (o), other (x), top (T), left (L), right (R), bottom (B)

             this      other     diff

            oooooo    ------    TTTTTT
            oooooo    ------    TTTTTT
            oooooo    --xx--    LL  RR
            oooooo    --xx--    LL  RR
            oooooo    ------    BBBBBB
            oooooo    ------    BBBBBB


            oooooo    ------    TTTTTT
            oooooo    ------    TTTTTT
            oooooo    --xxxx    LL
            oooooo    --xxxx    LL
            oooooo    --xxxx    LL
            oooooo    --xxxx    LL
                        xxxx
                        xxxx


            oooooo    xx----      RRRR
            oooooo    ------    BBBBBB
            oooooo    ------    BBBBBB
            oooooo    ------    BBBBBB
            oooooo    ------    BBBBBB
            oooooo    ------    BBBBBB

        */
        subtract(other: Rectangle): Array<Rectangle> {
            var rect_array: Array<Rectangle> = [];
            if (this.isEmpty()) {
                return rect_array;
            }

            if (other.isEmpty()) {
                rect_array.push(this);
                return rect_array;
            }

            var top_rectangle = new Rectangle(
                this.top_left,
                new Point(other.top_left.row - 1, this.bottom_right.col));
            if (!top_rectangle.isEmpty()) {
                rect_array.push(top_rectangle);
            }

            var left_rectangle = new Rectangle(
                new Point(other.top_left.row, this.top_left.col),
                new Point(other.bottom_right.row, other.top_left.col - 1));
            if (!left_rectangle.isEmpty()) {
                rect_array.push(left_rectangle);
            }

            var right_rectangle = new Rectangle(
                new Point(other.top_left.row, other.bottom_right.col + 1),
                new Point(other.bottom_right.row, this.bottom_right.col));
            if (!right_rectangle.isEmpty()) {
                rect_array.push(right_rectangle);
            }

            var bottom_rectangle = new Rectangle(
                new Point(other.bottom_right.row + 1, this.top_left.col),
                this.bottom_right);
            if (!bottom_rectangle.isEmpty()) {
                rect_array.push(bottom_rectangle);
            }
            return rect_array;
        }

        move(rows: number, cols: number) {
            this.top_left.row += rows;
            this.top_left.col += cols;
            this.bottom_right.row += rows;
            this.bottom_right.col += cols;
        }

        toString(): string {
            return this.top_left + '/' + this.bottom_right;
        }
    }
}
