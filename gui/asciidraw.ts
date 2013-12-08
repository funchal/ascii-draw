module ascii_draw {
    class Coordinates {
        constructor(public row: number = 0, public col: number = 0) {}
    }

    module SelectMoveController {
        var selecting = false;
        var S = new Coordinates(0, 0);
        var O = new Coordinates(0, 0);

        export function onMouseDown(target: HTMLTableCellElement): void {
            // TODO: if current cell is selected change to move mode
            selecting = true;
            clearSelection();
            S.col = utils.indexInParent(target);
            S.row = utils.indexInParent(target.parentElement);
            O = S;
            setSelected(target, true);
        }

        export function onMouseUp(target: HTMLTableCellElement): void {
            selecting = false;
        }

        export function onMouseOver(target: HTMLTableCellElement): void {
            if (selecting) {
                var N = new Coordinates(
                    utils.indexInParent(target.parentElement),
                    utils.indexInParent(target));
                applyToRectangle(S, O,
                    function(cell) { setSelected(cell, false); });
                applyToRectangle(S, N,
                    function(cell) { setSelected(cell, true); });
                O = N;
            }
        }
    }

    export var grid: HTMLTableElement;

    var emptyCell: string = ' ';

    function clearSelection(): void {
        var nrows = grid.rows.length;
        for (var r = 0; r < nrows; r++) {
            var row = <HTMLTableRowElement>grid.rows[r];
            var ncols = row.cells.length;
            for (var c = 0; c < ncols; c++) {
                var cell = <HTMLTableCellElement>row.cells[c];
                setSelected(cell, false);
            }
        }
    }

    function applyToRectangle(coordA: Coordinates,
                              coordB: Coordinates,
                              functor: (cell: HTMLTableCellElement) => void): void
    {
        var min = new Coordinates();
        var max = new Coordinates();

        if (coordA.row < coordB.row) {
            min.row = coordA.row;
            max.row = coordB.row;
        } else {
            min.row = coordB.row;
            max.row = coordA.row;
        }

        if (coordA.col < coordB.col) {
            min.col = coordA.col;
            max.col = coordB.col;
        } else {
            min.col = coordB.col;
            max.col = coordA.col;
        }

        for (var r = min.row; r <= max.row; r++) {
            var row = <HTMLTableRowElement>grid.rows[r];
            for (var c = min.col; c <= max.col; c++) {
                var cell = <HTMLTableCellElement>row.cells[c];
                functor(cell);
            }
        }
    };

    function resizeGrid(new_nrows: number, new_ncols: number): void {
        var nrows = grid.rows.length;

        for (var r = nrows; r < new_nrows; r++) {
            grid.insertRow();
        }

        for (var r = nrows; r > new_nrows; r--) {
            grid.deleteRow(r - 1);
        }

        for (var r = 0; r < new_nrows; r++) {
            var row: HTMLTableRowElement = <HTMLTableRowElement>grid.rows[r];
            var ncols = row.cells.length;
            for (var c = ncols; c < new_ncols; c++) {
                var cell = row.insertCell();
                var div = document.createElement('div');
                div.textContent = emptyCell;
                cell.appendChild(div);
            }

            for (var c = ncols; c > new_ncols; c--) {
                row.deleteCell(c - 1);
            }
        }
    }

    function changeFont(): void {
        utils.changeStyleRule('td div', 'width', 'auto');
        utils.changeStyleRule('td div', 'height', 'auto');

        var font_size = utils.computeFontSize();

        utils.changeStyleRule('td div', 'width', font_size.width + 'px');
        utils.changeStyleRule('td div', 'height', font_size.height + 'px');
    }

    function setSelected(cell: HTMLTableCellElement, selected: boolean): void {
        if (cell['data-selected'] != selected) {
            cell['data-selected'] == selected;
            if (selected) {
                utils.addClass(cell, 'selected');
            } else {
                utils.removeClass(cell, 'selected');
            }
        }
    }

    function findCell(target: EventTarget): HTMLTableCellElement {
        if (target instanceof HTMLDivElement) {
            target = (<HTMLDivElement>target).parentElement;
        }
        if (target instanceof HTMLTableCellElement) {
            return <HTMLTableCellElement>target;
        } else {
            return null;
        }
    }

    function onMouseDown(event: MouseEvent): void {
        var target = findCell(event.target);
        if (target !== null) {
            SelectMoveController.onMouseDown(target);
        }
        event.preventDefault();
    }

    function onMouseUp(event: MouseEvent): void {
        var target = findCell(event.target);
        if (target !== null) {
            SelectMoveController.onMouseUp(target);
        }
        event.preventDefault();
    }

    function onMouseOver(event: MouseEvent): void {
        var target = findCell(event.target);
        if (target !== null) {
            SelectMoveController.onMouseOver(target);
        }
        event.preventDefault();
    }

    export function init(): void {
        grid = <HTMLTableElement>document.getElementById('grid');

        changeFont();
        resizeGrid(25, 80);

        var row = <HTMLTableRowElement>grid.rows[0];
        var cell = <HTMLTableCellElement>row.cells[0];
        setSelected(cell, true);

        grid.addEventListener('mousedown', onMouseDown, false);
        grid.addEventListener('mouseup', onMouseUp, false);
        grid.addEventListener('mouseover', onMouseOver, false);
    }
}

window.addEventListener('load', ascii_draw.init, false);
