///<reference path='controllers.ts'/>
///<reference path='utils.ts'/>

module ascii_draw {
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import Controller = controllers.Controller;
    import SelectMoveController = controllers.SelectMoveController;
    import RectangleController = controllers.RectangleController;
    import commands = utils.commands;
    import Command = commands.Command;

    export var grid: HTMLTableElement;
    export var begin_selection: CellPosition;
    export var end_selection: CellPosition;

    var emptyCell: string = ' ';

    var controller: Controller = SelectMoveController;

    class CommandA implements Command {
        execute(): void {
            console.log('CommandA execute');
        }
        unexecute(): void {
            console.log('CommandA unexecute');
        }
    }

    class CommandB implements Command {
        execute(): void {
            console.log('CommandB execute');
        }
        unexecute(): void {
            console.log('CommandB unexecute');
        }
    }

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
        commands.undo();
    }

    function onRedo(): void {
        commands.redo();
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
                controller.setSelection(pos, pos);
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
                    // TODO: print a space character
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
                controller.setSelection(pos, pos);
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

    export function getCellPosition(cell: HTMLTableCellElement): CellPosition {
        return new CellPosition(utils.indexInParent(cell.parentElement),
                                utils.indexInParent(cell));
    }

    export function getCellAt(pos: CellPosition): HTMLTableCellElement {
        var row = <HTMLTableRowElement>grid.rows[pos.row];
        var cell = <HTMLTableCellElement>row.cells[pos.col];
        return cell;
    }

    export function applyToRectangle(rect: Rectangle,
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

    export function setSelected(cell: HTMLTableCellElement, selected: boolean): void {
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
            controller.reset();
        }
    }

    export function init(): void {
        grid = <HTMLTableElement>document.getElementById('grid');

        changeFont();
        setGridSize(50, 120);

        controller.init();

        commands.invoke(new CommandA());
        commands.invoke(new CommandB());
        commands.invoke(new CommandA());
        commands.invoke(new CommandA());
        commands.invoke(new CommandB());
        commands.invoke(new CommandA());

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
