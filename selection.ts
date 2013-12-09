'use strict';

module ascii_draw {
    import Rectangle = utils.Rectangle;

    export module selection {
        var contents: Array<Rectangle> = [];

        export function clear(): void {
            for (var i = contents.length; i > 0; i--) {
                remove(i-1);
            }
        }

        /* must not overlap any existing selection */
        export function add(sel: Rectangle): void {
            applyToRectangle(sel, setSelected, true);
            contents.push(sel);
        }

        export function remove(index: number): void {
            applyToRectangle(contents[index], setSelected, false);
            contents.splice(index, 1);
        }

        export function getContents(): string {
            return 'content\ncontent\ncontent\ncontent\ncontent\ncontent\n';
        }
    }
}