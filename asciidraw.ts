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

    export var grid: HTMLDivElement;
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

    export interface Row extends HTMLDivElement {};
    export interface Cell extends HTMLSpanElement {};

    function initiateCopyAction(): void {
        if (window.getSelection && document.createRange) {
            copypastearea.textContent = selection.getContents();
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
                controllers.begin_highlight.isEqual(controllers.end_highlight)) {
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

    export function getCellPosition(cell: Cell): CellPosition {
        return new CellPosition(utils.indexInParent(cell.parentElement),
                                utils.indexInParent(cell));
    }

    export function getRow(index: number): Row {
        return <Row>grid.children[index];
    }

    export function getCell(index: number, row: Row): Cell {
        return <Cell>row.children[index];
    }

    export function applyToRectangle(rect: Rectangle,
                                     functor: Function,
                                     param: any): void
    {
        for (var r = rect.top_left.row; r <= rect.bottom_right.row; r++) {
            var row = getRow(r);
            for (var c = rect.top_left.col; c <= rect.bottom_right.col; c++) {
                var cell = getCell(c, row);
                functor(cell, param);
            }
        }
    }

    function setGridSize(new_nrows: number, new_ncols: number): void {
        for (var r = nrows; r < new_nrows; r++) {
            grid.appendChild(document.createElement('div'));
        }

        for (var r = nrows; r > new_nrows; r--) {
            grid.removeChild(grid.children[r]);
        }

        for (var r = 0; r < new_nrows; r++) {
            var row = getRow(r);
            for (var c = ncols; c < new_ncols; c++) {
                var cell = row.appendChild(document.createElement('span'));
                cell.textContent = emptyCell;
            }

            for (var c = ncols; c > new_ncols; c--) {
                row.removeChild(row.children[r]);
            }
        }

        nrows = new_nrows;
        ncols = new_ncols;

        gridstatus.textContent = 'Grid size: ' + nrows + 'x' + ncols;
    }

    function changeFont(): void {
        utils.changeStyleRule('#grid span', 'width', 'auto');
        utils.changeStyleRule('#grid span', 'height', 'auto');
        utils.changeStyleRule('#grid div', 'height', 'auto');

        var font_size = utils.computeFontSize();

        utils.changeStyleRule('#grid span', 'width', font_size.width + 'px');
        utils.changeStyleRule('#grid span', 'height', font_size.height + 'px');
        utils.changeStyleRule('#grid div', 'height', font_size.height + 'px');
    }

    export function setSelected(cell: Cell, selected: boolean): void {
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

    export function setHighlighted(cell: Cell, highlighted: boolean): void {
        if (cell['data-highlighted'] !== highlighted) {
            cell['data-highlighted'] = highlighted;
            if (highlighted) {
                utils.addClass(cell, 'highlighted');
            } else {
                utils.removeClass(cell, 'highlighted');
            }
        } else {
            console.log('highlighted');
        }
    }

    function getTargetCell(target: EventTarget): Cell {
        if (target instanceof HTMLSpanElement) {
            return <Cell>target;
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
        grid = <HTMLDivElement>document.getElementById('grid');
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
