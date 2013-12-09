'use strict';

module ascii_draw {
    export module selection {
        import Rectangle = utils.Rectangle;
        import Cell = grid.Cell;

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

        function setSelected(cell: Cell, selected: boolean): void {
            if (cell['data-selected'] !== selected) {
                cell['data-selected'] = selected;
                if (selected) {
                    utils.addClass(cell, 'selected');
                } else {
                    utils.removeClass(cell, 'selected');
                }
            } else {
                console.log('selected');
            }
        }
    }
}