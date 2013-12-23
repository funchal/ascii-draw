'use strict';

module ascii_draw
{
    export module grid
    {
        import CellPosition = utils.Point;

        export var container: HTMLDivElement;
        export var nrows: number = 0;
        export var ncols: number = 0;

        export var emptyCell: string = ' ';

        export interface Row extends HTMLDivElement {};
        export interface Cell extends HTMLSpanElement {};

        export function init(): void
        {
            container = <HTMLDivElement>document.getElementById('grid');
            changeFont();
            setSize(50, 120);
        }

        export function getRow(row: number): Row
        {
            return <Row>container.children[row];
        }

        export function getCell(row: Row, col: number): Cell
        {
            return <Cell>row.children[col];
        }

        export function getCellPosition(cell: Cell): CellPosition
        {
            return new CellPosition(utils.indexInParent(cell.parentElement),
                                    utils.indexInParent(cell));
        }

        export function getTargetCell(target: EventTarget): Cell
        {
            if (target instanceof HTMLSpanElement) {
                return <Cell>target;
            } else {
                return null;
            }
        }

        function setSize(new_nrows: number, new_ncols: number): void
        {
            for (var r = nrows; r < new_nrows; r++) {
                container.appendChild(document.createElement('div'));
            }

            for (var r = nrows; r > new_nrows; r--) {
                container.removeChild(container.children[r]);
            }

            for (var r = 0; r < new_nrows; r++) {
                var row = getRow(r);
                for (var c = ncols; c < new_ncols; c++) {
                    var cell = <Cell>row.appendChild(document.createElement('span'));
                    writeToCell(cell, emptyCell);
                    cell['data-committed-content'] = emptyCell;
                }

                for (var c = ncols; c > new_ncols; c--) {
                    row.removeChild(row.children[r]);
                }
            }

            nrows = new_nrows;
            ncols = new_ncols;

            gridstatus.textContent = 'Grid size: ' + nrows + 'x' + ncols + ' (' + nrows*ncols + ')';
        }

        function changeFont(): void
        {
            utils.changeStyleRule('#grid span', 'width', 'auto');
            utils.changeStyleRule('#grid span', 'height', 'auto');
            utils.changeStyleRule('#grid div', 'height', 'auto');

            var font_size = utils.computeFontSize();
            // add 1 px to each dimension to compensate for borders
            var width = font_size.width + 1;
            var height = font_size.height + 1;

            utils.changeStyleRule('#grid span', 'width', width + 'px');
            utils.changeStyleRule('#grid span', 'height', height + 'px');
            utils.changeStyleRule('#grid div', 'height', height + 'px');
        }

        export function writeToCell(cell: Cell, character: string): void
        {
            cell.textContent = character;
        }
    }
}
