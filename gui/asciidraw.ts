module ascii_draw {
    class Coordinates {
        constructor(public row: number = 0, public col: number = 0) {}

        toString(): string {
            return this.row + 'x' + this.col;
        }

        isEqual(other: Coordinates) {
            return (this.row == other.row && this.col == other.col);
        }
    }

    class Rectangle {
        constructor(public top_left: Coordinates,
                    public bottom_right: Coordinates) {}

        intersect(other: Rectangle): Rectangle {
            var top_left = new Coordinates(
                Math.max(this.top_left.row, other.top_left.row),
                Math.max(this.top_left.col, other.top_left.col));
            var bottom_right = new Coordinates(
                Math.min(this.bottom_right.row, other.bottom_right.row),
                Math.min(this.bottom_right.col, other.bottom_right.col));
            return new Rectangle(top_left, bottom_right);
        }

        normalize(): void {
            if (this.top_left.row > this.bottom_right.row) {
                var tmp = this.top_left.row;
                this.top_left = new Coordinates(this.bottom_right.row,
                                                this.top_left.col);
                this.bottom_right = new Coordinates(tmp, this.bottom_right.col);
            }
            if (this.top_left.col > this.bottom_right.col) {
                var tmp = this.top_left.col;
                this.top_left = new Coordinates(this.top_left.row,
                                                this.bottom_right.col);
                this.bottom_right = new Coordinates(this.bottom_right.row, tmp);
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
                new Coordinates(other.top_left.row - 1, this.bottom_right.col));
            if (top_rectangle.isNormalized()) {
                rect_array.push(top_rectangle);
            }
            var left_rectangle = new Rectangle(
                new Coordinates(other.top_left.row, this.top_left.col),
                new Coordinates(other.bottom_right.row, other.top_left.col - 1));
            if (left_rectangle.isNormalized()) {
                rect_array.push(left_rectangle);
            }
            var right_rectangle = new Rectangle(
                new Coordinates(other.top_left.row, other.bottom_right.col + 1),
                new Coordinates(other.bottom_right.row, this.bottom_right.col));
            if (right_rectangle.isNormalized()) {
                rect_array.push(right_rectangle);
            }
            var bottom_rectangle = new Rectangle(
                new Coordinates(other.bottom_right.row + 1, this.top_left.col),
                this.bottom_right);
            if (bottom_rectangle.isNormalized()) {
                rect_array.push(bottom_rectangle);
            }
            return rect_array;
        }

        toString(): string {
            return this.top_left + "/" + this.bottom_right;
        }

        applyForEach(functor: (cell: HTMLTableCellElement) => void): void
        {
            for (var r = this.top_left.row; r <= this.bottom_right.row; r++) {
                var row = <HTMLTableRowElement>grid.rows[r];
                for (var c = this.top_left.col; c <= this.bottom_right.col; c++) {
                    var cell = <HTMLTableCellElement>row.cells[c];
                    functor(cell);
                }
            }
        }
    }

    module SelectMoveController {
        var selecting = false;
        var begin_selection: Coordinates = new Coordinates(0, 0);
        var end_selection: Coordinates = new Coordinates(0, 0);

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

        export function onMouseUp(target: HTMLTableCellElement): void {
            selecting = false;
        }

        export function onMouseOver(target: HTMLTableCellElement): void {
            var new_end_selection = new Coordinates(
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

            console.log('clear:' + clear);
            for (var i = 0; i < clear.length; i++) {
                clear[i].applyForEach(function(cell) {
                    setSelected(cell, false);
                });
            }

            console.log('paint:' + paint);
            for (var i = 0; i < paint.length; i++) {
                paint[i].applyForEach(function(cell) {
                    setSelected(cell, true);
                });
            }

            end_selection = new_end_selection;
        }

        function clearSelection(): void {
            var selection = new Rectangle(begin_selection, end_selection);
            selection.normalize();

            selection.applyForEach(function(cell) {
                setSelected(cell, false);
            });
        }

    }

    export var grid: HTMLTableElement;

    var emptyCell: string = ' ';

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
