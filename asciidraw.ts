///<reference path='controllers.ts'/>
///<reference path='utils.ts'/>

'use strict';

module ascii_draw {
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import Controller = controllers.Controller;
    import SelectMoveController = controllers.SelectMoveController;
    import RectangleController = controllers.RectangleController;
    import commands = utils.commands;
    import Command = commands.Command;

    export var grid: HTMLTableElement;
    var nrows: number = 0;
    var ncols: number = 0;
    var copypastearea: HTMLTextAreaElement;
    export var selection_button: HTMLButtonElement;
    export var rectangle_button: HTMLButtonElement;
    var gridstatus: HTMLDivElement;
    export var mousestatus: HTMLDivElement;
    export var selectionstatus: HTMLDivElement;
    var redo_button: HTMLButtonElement;
    var undo_button: HTMLButtonElement;
    var emptyCell: string = ' ';
    var controller: Controller = SelectMoveController;

    class ChangeSelection implements Command {
        constructor(public save_selection: Array<Rectangle>) {}

        execute(): void {
            console.log('execute ChangeSelection');
            // var old_selection = selection;
            // clear selection
            // for each in array, setSelection(this.save_selection);
            // this.save_selection = old_selection;
        }

        unexecute(): void {
            console.log('unexecute ChangeSelection');
            // var new_selection = selection;
            // clear selection
            // for each in array, setSelection(this.save_selection);
            // this.save_selection = new_selection;
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
        copypastearea.value = '';
        console.log('copy');
    }

    function initiatePasteAction(): void {
        copypastearea.value = '';
        copypastearea.focus();
    }

    function completePasteAction(): void {
        console.log('paste: ' + copypastearea.value);
        copypastearea.value = '';
    }

    function onUndo(): void {
        commands.undo();
        updateUndoRedo();
    }

    function onRedo(): void {
        commands.redo();
        updateUndoRedo();
    }

    function updateUndoRedo(): void {
        if (commands.canUndo()) {
            undo_button.disabled = false;
        } else {
            undo_button.disabled = true;
        }

        if (commands.canRedo()) {
            redo_button.disabled = false;
        } else {
            redo_button.disabled = true;
        }
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
        if (!event.ctrlKey && !event.altKey &&
            !event.metaKey && event.charCode > 0) {
            controller.onKeyPress(String.fromCharCode(event.charCode));
            event.preventDefault();
        }
        event.stopPropagation();
    }

    function onKeyDown(event: KeyboardEvent): void {
        if (!event.ctrlKey && !event.altKey &&
            !event.shiftKey && !event.metaKey) {
            var displacement: Array<number> = null;
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

            if (displacement &&
                controllers.begin_selection.isEqual(controllers.end_selection)) {
                controller.onArrowDown(displacement);
            }
        }

        if (event.ctrlKey && !event.altKey &&
            !event.shiftKey && !event.metaKey) {
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

    export function getRow(index: number): HTMLTableRowElement {
        return <HTMLTableRowElement>grid.rows[index];
    }

    export function getCell(index: number, row: HTMLTableRowElement): HTMLTableCellElement {
        return <HTMLTableCellElement>row.cells[index];
    }

    export function applyToRectangle(rect: Rectangle,
                              functor: Function,
                              ...params: any[]): void
    {
        for (var r = rect.top_left.row; r <= rect.bottom_right.row; r++) {
            var row = getRow(r);
            for (var c = rect.top_left.col; c <= rect.bottom_right.col; c++) {
                var cell = getCell(c, row);
                functor.apply(undefined, [cell].concat(params));
            }
        }
    }

    function setGridSize(new_nrows: number, new_ncols: number): void {
        for (var r = nrows; r < new_nrows; r++) {
            grid.insertRow();
        }

        for (var r = nrows; r > new_nrows; r--) {
            grid.deleteRow(r - 1);
        }

        for (var r = 0; r < new_nrows; r++) {
            var row: HTMLTableRowElement = getRow(r);
            for (var c = ncols; c < new_ncols; c++) {
                var cell = row.insertCell();
                cell.textContent = emptyCell;
            }

            for (var c = ncols; c > new_ncols; c--) {
                row.deleteCell(c - 1);
            }
        }

        gridstatus.textContent = 'Grid size: ' + new_nrows + 'x' + new_ncols;
    }

    function changeFont(): void {
        utils.changeStyleRule('td', 'width', 'auto');
        utils.changeStyleRule('td', 'height', 'auto');
        utils.changeStyleRule('tr', 'height', 'auto');

        var font_size = utils.computeFontSize();

        utils.changeStyleRule('td', 'width', font_size.width + 'px');
        utils.changeStyleRule('td', 'height', font_size.height + 'px');
        utils.changeStyleRule('tr', 'height', font_size.height + 'px');
    }

    export function setSelected(cell: HTMLTableCellElement,
                                selected: boolean): void {
        if (cell['data-selected'] !== selected) {
            cell['data-selected'] = selected;
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

    function controllerSwitcher(new_controller: Controller): () => void {
        return function(): void {
            controller.exit();
            controller = new_controller;
            controller.reset();
        }
    }

    export function init(): void {
        grid = <HTMLTableElement>document.getElementById('grid');
        copypastearea = <HTMLTextAreaElement>document.getElementById('copypastearea');
        rectangle_button = <HTMLButtonElement>document.getElementById('rectangle-button');
        selection_button = <HTMLButtonElement>document.getElementById('selection-button');
        undo_button = <HTMLButtonElement>document.getElementById('undo-button');
        redo_button = <HTMLButtonElement>document.getElementById('redo-button');
        gridstatus = <HTMLDivElement>document.getElementById('gridstatus');
        selectionstatus = <HTMLDivElement>document.getElementById('selectionstatus');
        mousestatus = <HTMLDivElement>document.getElementById('mousestatus');

        changeFont();
        setGridSize(50, 120);
        updateUndoRedo();

        controller.init();

        grid.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mouseup', onMouseUp, false);
        grid.addEventListener('mouseover', onMouseOver, false);
        grid.addEventListener('mouseleave', onMouseLeave, false);
        window.addEventListener('contextmenu', onContextMenu, false);
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);
        window.addEventListener('keypress', onKeyPress, false);

        rectangle_button.addEventListener(
            'click', controllerSwitcher(RectangleController), false);

        selection_button.addEventListener(
            'click', controllerSwitcher(SelectMoveController), false);

        undo_button.addEventListener('click', onUndo, false);
        redo_button.addEventListener('click', onRedo, false);
    }
}

window.addEventListener('load', ascii_draw.init, false);
