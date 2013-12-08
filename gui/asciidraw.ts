module ascii_draw {
    import Rectangle = ascii_draw.utils.Rectangle;
    import Point = ascii_draw.utils.Point;

    module SelectMoveController {
        var begin_selection: Point = new Point(0, 0);
        var end_selection: Point = new Point(0, 0);
        var selecting = false;
        var mouse_pos: Point = new Point(0, 0);

        export function onMouseDown(target: HTMLTableCellElement): void {
            // TODO: if current cell is selected change to move mode
            selecting = true;
            clearSelection();
            // FIXME: share some code with onMouseOver
            begin_selection.row = utils.indexInParent(target.parentElement);
            begin_selection.col = utils.indexInParent(target);
            end_selection = begin_selection;
            setSelected(target, true);
        }

        export function onMouseUp(): void {
            selecting = false;
        }

        export function onMouseOver(target: HTMLTableCellElement): void {
            var new_end_selection = new Point(
                utils.indexInParent(target.parentElement),
                utils.indexInParent(target));

            var statusbar = document.getElementById('statusbar');
            statusbar.textContent = 'Position: ' + new_end_selection;
            statusbar.textContent += ' - Size: ' + grid.rows.length + 'x' +
                (<HTMLTableRowElement>grid.rows[0]).cells.length;

            if (!selecting) {
                return;
            }

            var selection = new Rectangle(begin_selection, end_selection);
            selection.normalize();

            var new_selection = new Rectangle(begin_selection, new_end_selection);
            new_selection.normalize();

            statusbar.textContent += ' - Selection: ' +
                (new_selection.bottom_right.row - new_selection.top_left.row + 1) + 'x' +
                (new_selection.bottom_right.col - new_selection.top_left.col + 1);

            if (new_end_selection.isEqual(end_selection)) {
                return;
            }

            var keep = selection.intersect(new_selection);
            var clear = selection.subtract(keep);
            var paint = new_selection.subtract(keep);

            //console.log('clear:' + clear);
            for (var i = 0; i < clear.length; i++) {
                applyToRectangle(clear[i], setSelected, false);
            }

            //console.log('paint:' + paint);
            for (var i = 0; i < paint.length; i++) {
                applyToRectangle(paint[i], setSelected, true);
            }

            end_selection = new_end_selection;
        }

        function clearSelection(): void {
            var selection = new Rectangle(begin_selection, end_selection);
            selection.normalize();
            applyToRectangle(selection, setSelected, false);
        }
    }

    export var grid: HTMLTableElement;

    var emptyCell: string = ' ';

    function applyToRectangle(rect: Rectangle,
                              functor: (cell: HTMLTableCellElement, ...params: any[]) => void,
                              ...params: any[]): void
    {
        for (var r = rect.top_left.row; r <= rect.bottom_right.row; r++) {
            var row = <HTMLTableRowElement>grid.rows[r];
            for (var c = rect.top_left.col; c <= rect.bottom_right.col; c++) {
                var cell = <HTMLTableCellElement>row.cells[c];
                functor.bind(undefined, cell).apply(undefined, params);
            }
        }
    }

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
        if (cell['data-selected'] !== selected) {
            cell['data-selected'] == selected;
            if (selected) {
                utils.addClass(cell, 'selected');
            } else {
                utils.removeClass(cell, 'selected');
            }
        } else {
            console.log("bla");
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
        SelectMoveController.onMouseUp();
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
        window.addEventListener('mouseup', onMouseUp, false);
        grid.addEventListener('mouseover', onMouseOver, false);
    }
}

window.addEventListener('load', ascii_draw.init, false);
