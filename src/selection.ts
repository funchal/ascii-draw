///<reference path='grid.ts'/>

'use strict';

module ascii_draw
{
    export module selection
    {
        import Rectangle = utils.Rectangle;
        import Cell = grid.Cell;

        export var contents: Array<Rectangle> = [];

        export function clear(): void
        {
            for (var i = 0; i < contents.length; i++) {
                applyToRectangle(contents[i], selectCell, false);
            }
            contents = [];
        }

        export function set(new_contents: Array<Rectangle>): Array<Rectangle>
        {
            var old_contents = contents;
            for (var i = 0; i < contents.length; i++) {
                applyToRectangle(contents[i], selectCell, false);
            }
            contents = new_contents;
            for (var i = 0; i < contents.length; i++) {
                applyToRectangle(contents[i], selectCell, true);
            }
            return old_contents;
        }

        /* must not overlap any existing selection */
        export function add(sel: Rectangle): void
        {
            applyToRectangle(sel, selectCell, true);
            contents.push(sel);
        }

        export function remove(index: number): void
        {
            applyToRectangle(contents[index], selectCell, false);
            contents.splice(index, 1);
        }

        export function isUnit(): boolean
        {
            return (selection.contents.length == 1 &&
                    selection.contents[0].isUnit());
        }

        export function move(rows: number, cols: number): void
        {
            for (var i = 0; i < contents.length; i++) {
                applyToRectangle(contents[i], selectCell, false);
            }
            for (var i = 0; i < contents.length; i++) {
                contents[i].move(rows, cols);
            }
            for (var i = 0; i < contents.length; i++) {
                applyToRectangle(contents[i], selectCell, true);
            }
        }

        export function getContents(): string
        {
            return 'content\ncontent\ncontent\ncontent\ncontent\ncontent\n';
        }

        function selectCell(cell: Cell, selected: boolean): void
        {
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