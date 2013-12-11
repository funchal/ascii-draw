module ascii_draw {
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;

    interface Controller {
        init(): void;
        onMouseDown(target: HTMLTableCellElement): void;
        onMouseUp(): void;
        onMouseOver(target: HTMLTableCellElement): void;
        onMouseLeave(): void;
        exit(): void;
    }

    module RectangleController {
        export function init(): void {
            console.log('init');
            var selection_button = document.getElementById('rectangle-button');
            utils.addClass(selection_button, 'pressed');
        }
        export function onMouseDown(target: HTMLTableCellElement): void {
            console.log('down');
        }
        export function onMouseUp(): void {
            console.log('up');
        }
        export function onMouseOver(target: HTMLTableCellElement): void {
            console.log('over');
        }
        export function onMouseLeave(): void {
            console.log('leave');
        }
        export function exit(): void {
            console.log('exit');
            var selection_button = document.getElementById('rectangle-button');
            utils.removeClass(selection_button, 'pressed');
        }
    }

    var begin_selection: CellPosition;
    var end_selection: CellPosition;

    module SelectMoveController {
        var selecting = false;
        var mouse_pos: CellPosition = null;

        export function init(): void {
            var selection_button = document.getElementById('selection-button');
            utils.addClass(selection_button, 'pressed');
            begin_selection = new CellPosition(0, 0);
            end_selection = begin_selection;
            setSelected(getCellAt(begin_selection), true);
        }

        export function onMouseDown(target: HTMLTableCellElement): void {
            // TODO: if current cell is selected change to move mode
            selecting = true;
            setSelection(getCellPosition(target), getCellPosition(target));
        }

        export function onMouseUp(): void {
            selecting = false;
        }

        export function onMouseOver(target: HTMLTableCellElement): void {
            var pos = getCellPosition(target);
            setMousePosition(pos);
            if (selecting) {
                setSelection(begin_selection, pos);
            }
        }

        export function onMouseLeave(): void {
            setMousePosition(null);
        }

        export function exit(): void {
            console.log('exit');
            var selection_button = document.getElementById('selection-button');
            utils.removeClass(selection_button, 'pressed');
        }

        function setMousePosition(new_pos: CellPosition): void {
            if (mouse_pos !== null) {
                utils.removeClass(getCellAt(mouse_pos), 'mouse');
            }
            mouse_pos = new_pos;

            var mousestatus = document.getElementById('mousestatus');
            if (mouse_pos !== null) {
                utils.addClass(getCellAt(mouse_pos), 'mouse');
                mousestatus.textContent = 'Cursor: ' + mouse_pos;
            } else {
                mousestatus.textContent = '';
            }
        }

        export function setSelection(new_begin_selection: CellPosition,
                              new_end_selection: CellPosition): void {
            var new_selection = new Rectangle(new_begin_selection,
                                              new_end_selection,
                                              true /*normalize*/);
            var old_selection = new Rectangle(begin_selection,
                                              end_selection,
                                              true /*normalize*/);

            if (old_selection.isEqual(new_selection)) {
                return;
            }

            begin_selection = new_begin_selection;
            end_selection = new_end_selection;

            var keep = old_selection.intersect(new_selection);
            var clear = old_selection.subtract(keep);
            var paint = new_selection.subtract(keep);

            for (var i = 0; i < clear.length; i++) {
                applyToRectangle(clear[i], setSelected, false);
            }

            for (var i = 0; i < paint.length; i++) {
                applyToRectangle(paint[i], setSelected, true);
            }

            var selectionstatus = document.getElementById('selectionstatus');
            if (new_selection.getHeight() > 1 || new_selection.getWidth() > 1) {
                selectionstatus.textContent = 'Selection: ' +
                    new_selection.getHeight() + 'x' + new_selection.getWidth();
            } else {
                selectionstatus.textContent = '';
            }
        }
    }

    export var grid: HTMLTableElement;

    var emptyCell: string = ' ';

    var controller: Controller = SelectMoveController;

    function getSelectionContent(): string {
        return 'content\ncontent\ncontent\ncontent\ncontent\ncontent\n';
    }

    function initiateCopyAction(): void {
        if (window.getSelection && document.createRange) {
            var copypastearea = document.getElementById('copypastearea');
            copypastearea.textContent = getSelectionContent();
            var sel = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(copypastearea);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            console.log('fail to copy');
        }
    }

    function completeCopyAction(): void {
        var copypastearea = <HTMLTextAreaElement>document.getElementById('copypastearea');
        copypastearea.value = '';
        console.log('copy');
    }

    function initiatePasteAction(): void {
        var copypastearea = <HTMLTextAreaElement>document.getElementById('copypastearea');
        copypastearea.value = '';
        copypastearea.focus();
    }

    function completePasteAction(): void {
        var copypastearea = <HTMLTextAreaElement>document.getElementById('copypastearea');
        console.log('paste: ' + copypastearea.value);
        copypastearea.value = '';
    }

    function onUndo(): void {
        console.log('undo');
    }

    function onRedo(): void {
        console.log('redo');
    }

    function onKeyUp(event: KeyboardEvent): void {
        if (event.ctrlKey && !event.altKey && !event.shiftKey) {
            switch (event.keyCode) {
                case 67: /* ctrl+c: copy */
                    completeCopyAction();
                    break;
                case 86: /* ctrl+v: paste */
                    completePasteAction();
                    break;
                case 88: /* ctrl+x: cut */
                    completeCopyAction();
                    break;
            }
        }
        event.stopPropagation();
    }

    function onKeyPress(event: KeyboardEvent): void {
        if (!event.ctrlKey && !event.altKey && !event.metaKey && event.charCode > 0) {
            applyToRectangle(new Rectangle(begin_selection, end_selection, true /*normalize*/),
                             function(cell: HTMLTableCellElement) {
                                cell.children[0].textContent = String.fromCharCode(event.charCode);
                             });
            var displacement = [0, 1];
            if (displacement && begin_selection.isEqual(end_selection) &&
                                begin_selection.isEqual(end_selection)) {
                var pos = new CellPosition(begin_selection.row + displacement[0],
                                           begin_selection.col + displacement[1]);
                SelectMoveController.setSelection(pos, pos);
            }
            event.preventDefault();
        }
        event.stopPropagation();
    }

    function onKeyDown(event: KeyboardEvent): void {
        if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
            var displacement: any = null;
            switch (event.keyCode) {
                case 37: /* left arrow */
                    displacement = [0, -1];
                    event.preventDefault();
                    break;
                case 38: /* up arrow */
                    displacement = [-1, 0];
                    event.preventDefault();
                    break;
                case 39: /* right arrow */
                    displacement = [0, 1];
                    event.preventDefault();
                    break;
                case 40: /* down arrow */
                    displacement = [1, 0];
                    event.preventDefault();
                    break;
                case 9: /* tab */
                    event.preventDefault();
                    break;
                case 13: /* enter */
                    event.preventDefault();
                    break;
                case 8: /* backspace */
                    event.preventDefault();
                    break;
                case 27: /* escape */
                    event.preventDefault();
                    break;
                case 46: /* delete */
                    event.preventDefault();
                    break;
            }

            if (displacement && begin_selection.isEqual(end_selection) &&
                                begin_selection.isEqual(end_selection)) {
                var pos = new CellPosition(begin_selection.row + displacement[0],
                                           begin_selection.col + displacement[1]);
                SelectMoveController.setSelection(pos, pos);
            }
        }

        if (event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
            switch (event.keyCode) {
                case 67: /* ctrl+c: copy */
                    initiateCopyAction();
                    break;
                case 86: /* ctrl+v: paste */
                    initiatePasteAction();
                    break;
                case 88: /* ctrl+x: cut */
                    initiateCopyAction();
                    break;
                case 89: /* ctrl+y: redo */
                    onRedo();
                    break;
                case 90: /* ctrl+z: undo */
                    onUndo();
                    break;
            }
        }
        event.stopPropagation();
    }

    function getCellPosition(cell: HTMLTableCellElement): CellPosition {
        return new CellPosition(utils.indexInParent(cell.parentElement),
                                utils.indexInParent(cell));
    }

    function getCellAt(pos: CellPosition): HTMLTableCellElement {
        var row = <HTMLTableRowElement>grid.rows[pos.row];
        var cell = <HTMLTableCellElement>row.cells[pos.col];
        return cell;
    }

    function applyToRectangle(rect: Rectangle,
                              functor: Function,
                              ...params: any[]): void
    {
        for (var r = rect.top_left.row; r <= rect.bottom_right.row; r++) {
            var row = <HTMLTableRowElement>grid.rows[r];
            for (var c = rect.top_left.col; c <= rect.bottom_right.col; c++) {
                var cell = <HTMLTableCellElement>row.cells[c];
                functor.apply(undefined, [cell].concat(params));
            }
        }
    }

    function setGridSize(new_nrows: number, new_ncols: number): void {
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

        var gridstatus = document.getElementById('gridstatus');
        gridstatus.textContent = 'Grid size: ' + new_nrows + 'x' + new_ncols;
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
            console.log('bla');
        }
    }

    function getTargetCell(target: EventTarget): HTMLTableCellElement {
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
        var target = getTargetCell(event.target);
        if (target !== null) {
            controller.onMouseDown(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseUp(event: MouseEvent): void {
        controller.onMouseUp();
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseOver(event: MouseEvent): void {
        var target = getTargetCell(event.target);
        if (target !== null) {
            controller.onMouseOver(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseLeave(event: MouseEvent): void {
        controller.onMouseLeave();
        event.stopPropagation();
        event.preventDefault();
    }

    function onContextMenu(event: MouseEvent): void {
        event.stopPropagation();
        event.preventDefault();
    }

    function controllerSwitcher(new_controller: Controller) {
        return function(): void {
            controller.exit();
            controller = new_controller;
            controller.init();
        }
    }

    export function init(): void {
        grid = <HTMLTableElement>document.getElementById('grid');

        changeFont();
        setGridSize(50, 120);

        controller.init();

        grid.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mouseup', onMouseUp, false);
        grid.addEventListener('mouseover', onMouseOver, false);
        grid.addEventListener('mouseleave', onMouseLeave, false);
        window.addEventListener('contextmenu', onContextMenu, false);
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);
        window.addEventListener('keypress', onKeyPress, false);

        var rectangle_button = document.getElementById('rectangle-button');
        rectangle_button.addEventListener(
            'click', controllerSwitcher(RectangleController), false);

        var selection_button = document.getElementById('selection-button');
        selection_button.addEventListener(
            'click', controllerSwitcher(SelectMoveController), false);

        var undo_button = document.getElementById('undo-button');
        undo_button.addEventListener('click', onUndo, false);

        var redo_button = document.getElementById('redo-button');
        redo_button.addEventListener('click', onRedo, false);
    }
}

window.addEventListener('load', ascii_draw.init, false);
